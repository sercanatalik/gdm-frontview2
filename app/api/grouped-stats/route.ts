import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'

interface GroupedStatMeasure {
  key: string
  label: string
  field: string
  tableName: string
  aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min' | 'countDistinct' | 'avgBy'
  weightField?: string // Required when aggregation is 'avgBy'
  asOfDateField?: string
  result1?: {
    field: string
    aggregation: 'count' | 'countDistinct' | 'sum' | 'avg' | 'max' | 'min' | 'avgBy'
    weightField?: string // Required when aggregation is 'avgBy'
  }
  result2?: {
    field: string
    aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min' | 'countDistinct' | 'avgBy'
    weightField?: string // Required when aggregation is 'avgBy'
  }
  result3?: {
    field: string
    aggregation: 'sum' | 'count' | 'countDistinct' | 'avg' | 'max' | 'min' | 'avgBy'
    weightField?: string // Required when aggregation is 'avgBy'
  }
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  limit?: number
  additionalSelectFields?: Array<{
    field: string
    aggregation?: 'sum' | 'count' | 'countDistinct' | 'avg' | 'max' | 'min' | 'avgBy'
    weightField?: string // Required when aggregation is 'avgBy'
    alias: string
  }>
}

interface FilterCondition {
  type: string
  operator: string
  value: string[]
  field?: string
}

interface GroupedStatData {
  groupValue: string
  current: number
  previous: number
  change: number
  changePercent: number
  counterpartyCount: number
  collateralAmount: number
  percentage: number
}

const formatDate = (date: Date): string => date.toISOString().split('T')[0]

// Helper function to parse relative date
const parseRelativeDate = (relativeDate: string, baseDate?: string): string => {
  const now = baseDate ? new Date(baseDate) : new Date()
  
  switch (relativeDate) {
    case 'latest':
      return formatDate(now)
    
    case '-1d': {
      const date = new Date(now)
      date.setDate(date.getDate() - 1)
      return formatDate(date)
    }
    
    case '-1w': {
      const date = new Date(now)
      date.setDate(date.getDate() - 7)
      return formatDate(date)
    }
    
    case '-1m': {
      const date = new Date(now)
      date.setMonth(date.getMonth() - 1)
      return formatDate(date)
    }
    
    case '-6m': {
      const date = new Date(now)
      date.setMonth(date.getMonth() - 6)
      return formatDate(date)
    }
    
    case '-1y': {
      const date = new Date(now)
      date.setFullYear(date.getFullYear() - 1)
      return formatDate(date)
    }
    
    default:
      // If it's already a date string (YYYY-MM-DD), return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(relativeDate)) {
        return relativeDate
      }
      // Otherwise, default to today
      return formatDate(now)
  }
}

// Helper function to find closest available date
const findClosestDate = async (relativeDate: string, tableName: string, asOfDateField: string = 'asOfDate'): Promise<string> => {
  const cacheService = getClickHouseCacheService(300)
  
  const query = `
    SELECT ${asOfDateField}
    FROM ${tableName}
    WHERE ${asOfDateField} <= '${relativeDate}'
    ORDER BY ${asOfDateField} DESC
    LIMIT 1
  `
  try {
    const result = await cacheService.query<{ [key: string]: string }>(query, undefined, `closest_date:${tableName}:${asOfDateField}:${relativeDate}`, 300)
    return result[0]?.[asOfDateField] || relativeDate
  } catch (error) {
    console.warn(`Could not find closest date for ${relativeDate} in ${tableName}, using original date`)
    return relativeDate
  }
}

// Helper function to build filter conditions for ClickHouse
function buildFilterConditions(filters: FilterCondition[]): string {
  if (!filters || filters.length === 0) {
    return ''
  }
  
  const conditions = filters.map(filter => {
    const { type, operator, value, field } = filter
    // Use field if provided, otherwise fall back to type
    const fieldName = field || type
    
    switch (operator) {
      case 'is':
        if (value.length === 1) {
          return `${fieldName} = '${value[0]}'`
        } else {
          const values = value.map(v => `'${v}'`).join(', ')
          return `${fieldName} IN (${values})`
        }
      case 'is not':
        if (value.length === 1) {
          return `${fieldName} != '${value[0]}'`
        } else {
          const values = value.map(v => `'${v}'`).join(', ')
          return `${fieldName} NOT IN (${values})`
        }
      case 'is any of':
        const values = value.map(v => `'${v}'`).join(', ')
        return `${fieldName} IN (${values})`
      case 'include':
        return value.map(v => `${fieldName} LIKE '%${v}%'`).join(' OR ')
      case 'do not include':
        return value.map(v => `${fieldName} NOT LIKE '%${v}%'`).join(' AND ')
      case 'include all of':
        return value.map(v => `${fieldName} LIKE '%${v}%'`).join(' AND ')
      case 'include any of':
        return value.map(v => `${fieldName} LIKE '%${v}%'`).join(' OR ')
      case 'exclude all of':
        return value.map(v => `${fieldName} NOT LIKE '%${v}%'`).join(' AND ')
      case 'exclude if any of':
        return value.map(v => `${fieldName} NOT LIKE '%${v}%'`).join(' OR ')
      case 'before':
        return `${fieldName} < '${value[0]}'`
      case 'after':
        return `${fieldName} > '${value[0]}'`
      default:
        return `${fieldName} = '${value[0]}'`
    }
  }).filter(Boolean)
  
  return conditions.length > 0 ? ` AND (${conditions.join(' AND ')})` : ''
}

function buildGroupedQuery(measure: GroupedStatMeasure, groupBy: string, asOfDate: string, filters: FilterCondition[] = []) {
  let field = measure.field
  let aggregationFunction = measure.aggregation
  let mainAggregation: string
  
  // For numeric aggregations, ensure the field is treated as numeric
  if (['sum', 'avg', 'max', 'min'].includes(measure.aggregation)) {
    field = `toFloat64OrZero(toString(${measure.field}))`
  }
  
  // ClickHouse uses countDistinct (camelCase)
  if (measure.aggregation === 'countDistinct') {
    aggregationFunction = 'countDistinct'
  }
  
  // Handle weighted average (avgBy)
  if (measure.aggregation === 'avgBy') {
    if (!measure.weightField) {
      throw new Error(`weightField is required for avgBy aggregation on measure ${measure.key}`)
    }
    // Calculate weighted average: sum(value * weight) / sum(weight)
    const valueField = `toFloat64OrZero(toString(${measure.field}))`
    const weightField = `toFloat64OrZero(toString(${measure.weightField}))`
    mainAggregation = `sum(${valueField} * ${weightField}) / sum(${weightField})`
  } else {
    mainAggregation = `${aggregationFunction}(${field})`
  }
  
  const filterConditions = buildFilterConditions(filters)
  const asOfDateField = measure.asOfDateField || 'asOfDate'
  const orderBy = measure.orderBy || 'current'
  const orderDirection = measure.orderDirection || 'DESC'
  const limit = measure.limit || 50
  
  // Build result1 (defaults to counterParty count)
  let result1Query = ''
  if (measure.result1) {
    if (measure.result1.aggregation === 'avgBy') {
      if (!measure.result1.weightField) {
        throw new Error(`weightField is required for avgBy aggregation on result1`)
      }
      const valueField = `toFloat64OrZero(toString(${measure.result1.field}))`
      const weightField = `toFloat64OrZero(toString(${measure.result1.weightField}))`
      result1Query = `sum(${valueField} * ${weightField}) / sum(${weightField}) as result1`
    } else {
      let result1Field = measure.result1.field
      if (['sum', 'avg', 'max', 'min'].includes(measure.result1.aggregation)) {
        result1Field = `toFloat64OrZero(toString(${measure.result1.field}))`
      }
      let aggregation = measure.result1.aggregation === 'countDistinct' ? 'countDistinct' : measure.result1.aggregation
      result1Query = `${aggregation}(${result1Field}) as result1`
    }
  } else {
    result1Query = `countDistinct(counterParty) as result1`
  }
  
  // Build result2 (defaults to notional sum)
  let result2Query = ''
  if (measure.result2) {
    if (measure.result2.aggregation === 'avgBy') {
      if (!measure.result2.weightField) {
        throw new Error(`weightField is required for avgBy aggregation on result2`)
      }
      const valueField = `toFloat64OrZero(toString(${measure.result2.field}))`
      const weightField = `toFloat64OrZero(toString(${measure.result2.weightField}))`
      result2Query = `sum(${valueField} * ${weightField}) / sum(${weightField}) as result2`
    } else {
      let result2Field = measure.result2.field
      if (['sum', 'avg', 'max', 'min'].includes(measure.result2.aggregation)) {
        result2Field = `toFloat64OrZero(toString(${measure.result2.field}))`
      }
      let aggregation = measure.result2.aggregation === 'countDistinct' ? 'countDistinct' : measure.result2.aggregation
      result2Query = `${aggregation}(${result2Field}) as result2`
    }
  } else {
    result2Query = `sum(toFloat64OrZero(toString(collateralAmount))) as result2`
  }
  
  // Build result3 (optional)
  let result3Query = ''
  if (measure.result3) {
    if (measure.result3.aggregation === 'avgBy') {
      if (!measure.result3.weightField) {
        throw new Error(`weightField is required for avgBy aggregation on result3`)
      }
      const valueField = `toFloat64OrZero(toString(${measure.result3.field}))`
      const weightField = `toFloat64OrZero(toString(${measure.result3.weightField}))`
      result3Query = `, sum(${valueField} * ${weightField}) / sum(${weightField}) as result3`
    } else {
      let result3Field = measure.result3.field
      if (['sum', 'avg', 'max', 'min'].includes(measure.result3.aggregation)) {
        result3Field = `toFloat64OrZero(toString(${measure.result3.field}))`
      }
      let aggregation = measure.result3.aggregation === 'countDistinct' ? 'countDistinct' : measure.result3.aggregation
      result3Query = `, ${aggregation}(${result3Field}) as result3`
    }
  }
  
  // Build additional select fields
  const additionalSelects = measure.additionalSelectFields?.map(field => {
    if (field.aggregation === 'avgBy') {
      if (!field.weightField) {
        throw new Error(`weightField is required for avgBy aggregation on additional field ${field.alias}`)
      }
      const valueField = `toFloat64OrZero(toString(${field.field}))`
      const weightField = `toFloat64OrZero(toString(${field.weightField}))`
      return `sum(${valueField} * ${weightField}) / sum(${weightField}) as ${field.alias}`
    } else if (field.aggregation) {
      let fieldQuery = field.field
      if (['sum', 'avg', 'max', 'min'].includes(field.aggregation)) {
        fieldQuery = `toFloat64OrZero(toString(${field.field}))`
      }
      let aggregation = field.aggregation === 'countDistinct' ? 'countDistinct' : field.aggregation
      return `${aggregation}(${fieldQuery}) as ${field.alias}`
    }
    return `${field.field} as ${field.alias}`
  }).join(', ') || ''
  
  const additionalSelectsClause = additionalSelects ? `, ${additionalSelects}` : ''
  
  // For Others aggregation, we need to fetch more data than the limit
  const queryLimit = (limit <= 12) ? 100 : limit
  
  return `
    SELECT 
      ${groupBy} as groupValue,
      ${mainAggregation} as current,
      ${result1Query},
      ${result2Query}${result3Query}${additionalSelectsClause}
    FROM ${measure.tableName}
    WHERE ${asOfDateField} = '${asOfDate}'${filterConditions}
    GROUP BY ${groupBy}
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT ${queryLimit}
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { measure, groupBy, relativeDt, asOfDate, filters } = body

    if (!measure) {
      return NextResponse.json(
        { error: 'Measure is required' },
        { status: 400 }
      )
    }
    
    if (!groupBy) {
      return NextResponse.json(
        { error: 'groupBy field is required' },
        { status: 400 }
      )
    }
    
    if (!relativeDt) {
      return NextResponse.json(
        { error: 'relativeDt is required' },
        { status: 400 }
      )
    }
    
    const cacheService = getClickHouseCacheService(300) // 5 minutes cache
    
    // Convert relative dates to actual dates
    const latestDate = asOfDate || parseRelativeDate('latest')
    const requestedDate = parseRelativeDate(relativeDt, asOfDate)
    
    // Find the closest available dates
    const asOfDateField = measure.asOfDateField || 'asOfDate'
    const actualRequestedDate = await findClosestDate(requestedDate, measure.tableName, asOfDateField)
    const actualLatestDate = await findClosestDate(latestDate, measure.tableName, asOfDateField)
    
    // Build queries for both dates with filters
    const requestedQuery = buildGroupedQuery(measure, groupBy, actualRequestedDate, filters)
    const latestQuery = buildGroupedQuery(measure, groupBy, actualLatestDate, filters)
    
    const filterHash = Buffer.from(JSON.stringify(filters || [])).toString('base64')
    const cacheKeyRequested = `grouped-stats:${measure.tableName}:${groupBy}:${relativeDt}:${filterHash}`
    const cacheKeyLatest = `grouped-stats:${measure.tableName}:${groupBy}:${asOfDate || 'latest'}:${filterHash}`
   
    // Execute both queries in parallel
    const [requestedData, latestData] = await Promise.all([
      cacheService.query<{groupValue: string, current: number, result1: number, result2: number, result3?: number}>(requestedQuery, undefined, cacheKeyRequested, 300),
      cacheService.query<{groupValue: string, current: number, result1: number, result2: number, result3?: number}>(latestQuery, undefined, cacheKeyLatest, 300)
    ])
    
    // Calculate total for percentage calculation
    const totalCurrent = latestData.reduce((sum, item) => sum + item.current, 0)
    
    // Process results with "Others" aggregation
    const limit = measure.limit || 50
    let processedData: GroupedStatData[]
    
    if (latestData.length > 11 && limit <= 12) {
      // Take top 11 items
      const topItems = latestData.slice(0, 11)
      const otherItems = latestData.slice(11)
      
      // Aggregate "Others"
      const othersData = {
        groupValue: 'Others',
        current: otherItems.reduce((sum, item) => sum + item.current, 0),
        result1: otherItems.reduce((sum, item) => sum + item.result1, 0),
        result2: otherItems.reduce((sum, item) => sum + item.result2, 0),
        result3: otherItems.reduce((sum, item) => sum + (item.result3 || 0), 0)
      }
      
      // Find corresponding "Others" data in requested results
      const otherRequestedItems = requestedData.filter(r => 
        !topItems.some(t => t.groupValue === r.groupValue)
      )
      const othersPrevious = otherRequestedItems.reduce((sum, item) => sum + item.current, 0)
      
      // Process top items + others
      const allItems = [...topItems, othersData]
      processedData = allItems.map(latestItem => {
        let requestedItem
        let previous = 0
        
        if (latestItem.groupValue === 'Others') {
          previous = othersPrevious
        } else {
          requestedItem = requestedData.find(r => r.groupValue === latestItem.groupValue)
          previous = requestedItem?.current || 0
        }
        
        const current = latestItem.current
        const change = current - previous
        const changePercent = previous !== 0 ? (change / previous) * 100 : 0
        const percentage = totalCurrent > 0 ? (current / totalCurrent) * 100 : 0
        
        return {
          groupValue: latestItem.groupValue,
          current,
          previous,
          change,
          changePercent,
          counterpartyCount: latestItem.result1,
          collateralAmount: latestItem.result2,
          percentage
        }
      })
    } else {
      // No aggregation needed, process normally
      processedData = latestData.map(latestItem => {
        const requestedItem = requestedData.find(r => r.groupValue === latestItem.groupValue)
        const previous = requestedItem?.current || 0
        const current = latestItem.current
        const change = current - previous
        const changePercent = previous !== 0 ? (change / previous) * 100 : 0
        const percentage = totalCurrent > 0 ? (current / totalCurrent) * 100 : 0
        
        return {
          groupValue: latestItem.groupValue,
          current,
          previous,
          change,
          changePercent,
          counterpartyCount: latestItem.result1,
          collateralAmount: latestItem.result2,
          percentage
        }
      })
    }
    
    const result = processedData
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Grouped Stats API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Table') && error.message.includes('doesn\'t exist')) {
        return NextResponse.json(
          { error: 'Table not found' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('column') || error.message.includes('field')) {
        return NextResponse.json(
          { error: 'Invalid field or column' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}