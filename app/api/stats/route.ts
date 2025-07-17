import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'

interface StatMeasure {
  key: string
  label: string
  field: string
  tableName: string
  aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min'
}

interface FilterCondition {
  type: string
  operator: string
  value: string[]
  field?: string
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
const findClosestDate = async (relativeDate: string, tableName: string): Promise<string> => {
  const cacheService = getClickHouseCacheService(300)
  
  const query = `
    SELECT asOfDate
    FROM ${tableName}
    WHERE asOfDate <= '${relativeDate}'
    ORDER BY asOfDate DESC
    LIMIT 1
  `
  try {
    const result = await cacheService.query<{ asOfDate: string }>(query, undefined, `closest_date:${tableName}:${relativeDate}`, 300)
    return result[0]?.asOfDate || relativeDate
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

function buildQuery(measures: StatMeasure[], asOfDate: string, tableName: string, filters: FilterCondition[] = []) {
  const aggregations = measures.map(m => {
    let field = m.field
    
    // For numeric aggregations, ensure the field is treated as numeric
    // Use toFloat64OrZero for safe conversion that handles both string and numeric types
    if (['sum', 'avg', 'max', 'min'].includes(m.aggregation)) {
      field = `toFloat64OrZero(toString(${m.field}))`
    }
    
    return `${m.aggregation}(${field}) as ${m.key}`
  }).join(', ')
  
  const filterConditions = buildFilterConditions(filters)
  
  return `
    SELECT ${aggregations}
    FROM ${tableName}
    WHERE asOfDate = '${asOfDate}'${filterConditions}
  `

}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { measures, relativeDt, asOfDate, filters } = body

    if (!measures || !Array.isArray(measures) || measures.length === 0) {
      return NextResponse.json(
        { error: 'Measures array is required' },
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
    
    // Group measures by table
    const measuresByTable = measures.reduce((acc: Record<string, StatMeasure[]>, measure) => {
      if (!acc[measure.tableName]) {
        acc[measure.tableName] = []
      }
      acc[measure.tableName].push(measure)
      return acc
    }, {})
    
    const result: Record<string, {
      current: number
      previous: number
      change: number
      changePercent: number
    }> = {}
    
    // Convert relative dates to actual dates
    // Use provided asOfDate or fallback to latest
    const latestDate = asOfDate || parseRelativeDate('latest')
    // Calculate the requested date relative to the asOfDate if provided
    const requestedDate = parseRelativeDate(relativeDt, asOfDate)
    
    // Process each table separately
    for (const [tableName, tableMeasures] of Object.entries(measuresByTable)) {
      // Find the closest available dates for this table
      const actualRequestedDate = await findClosestDate(requestedDate, tableName)
      const actualLatestDate = await findClosestDate(latestDate, tableName)
      // console.log(`Processing table: ${tableName}, Requested Date: ${actualRequestedDate}, Latest Date: ${actualLatestDate}`)
      // Build queries for both dates with filters
      const requestedQuery = buildQuery(tableMeasures, actualRequestedDate, tableName, filters)
      const latestQuery = buildQuery(tableMeasures, actualLatestDate, tableName, filters)
      // console.log(`Executing queries for ${tableName} Latest: ${latestQuery}`)
      const filterHash = Buffer.from(JSON.stringify(filters || [])).toString('base64')
      const measureHash = Buffer.from(JSON.stringify(tableMeasures.map(m => m.key))).toString('base64')
      const cacheKeyRequested = `stats:${tableName}:${relativeDt}:${measureHash}:${filterHash}`
      const cacheKeyLatest = `stats:${tableName}:${asOfDate || 'latest'}:${measureHash}:${filterHash}`
     
      // Execute both queries in parallel
      const [requestedData, latestData] = await Promise.all([
        cacheService.query<Record<string, number>>(requestedQuery, undefined, cacheKeyRequested, 300),
        cacheService.query<Record<string, number>>(latestQuery, undefined, cacheKeyLatest, 300)
      ])
      
      // Calculate comparison for each measure in this table
      tableMeasures.forEach(measure => {
        const previous = requestedData[0]?.[measure.key] || 0
        const current = latestData[0]?.[measure.key] || 0
        const change = current - previous
        const changePercent = previous !== 0 ? (change / previous) * 100 : 0
        
        result[measure.key] = {
          current,
          previous,
          change,
          changePercent
        }
      })
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Stats API error:', error)
    
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