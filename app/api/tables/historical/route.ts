import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'
import { getTableConfig, formatDateForTable } from '@/lib/table-config'

interface FilterCondition {
  type: string
  operator: string
  value: string[]
  field?: string
}

const formatDate = (date: Date): string => date.toISOString().split('T')[0]


// Helper function to find closest available date
const findClosestDate = async (targetDate: string, tableName: string): Promise<string> => {
  const cacheService = getClickHouseCacheService(300)
  const tableConfig = getTableConfig(tableName)
  const dateCol = tableConfig.dateColumn
  const formattedDate = formatDateForTable(targetDate, tableName)

  const query = `
    SELECT ${dateCol} as dateVal
    FROM ${tableName} FINAL
    WHERE ${dateCol} <= '${formattedDate}'
    ORDER BY ${dateCol} DESC
    LIMIT 1
  `
  try {
    const result = await cacheService.query<{ dateVal: string }>(query, undefined, `closest_date:${tableName}:${formattedDate}`, 300)
    return result[0]?.dateVal || formattedDate
  } catch (error) {
    console.warn(`Could not find closest date for ${targetDate} in ${tableName}, using original date`)
    return formattedDate
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

// Helper function to build historical data query
function buildHistoricalQuery(
  tableName: string,
  fieldName: string,
  groupBy: string | undefined,
  baseDate: string,
  filters: FilterCondition[] = []
): string {
  const filterConditions = buildFilterConditions(filters)
  const tableConfig = getTableConfig(tableName)
  const dateCol = tableConfig.dateColumn

  if (groupBy) {
    // Query for grouped data
    return `
      SELECT
        ${dateCol} as asOfDate,
        ${groupBy},
        SUM(${fieldName}) as ${fieldName}
      FROM ${tableName} FINAL
      WHERE ${dateCol} <= '${baseDate}'${filterConditions}
      GROUP BY ${dateCol}, ${groupBy}
      ORDER BY ${dateCol}, ${groupBy}
    `
  } else {
    // Query for ungrouped data
    return `
      SELECT
        ${dateCol} as asOfDate,
        SUM(${fieldName}) as ${fieldName}
      FROM ${tableName} FINAL
      WHERE ${dateCol} <= '${baseDate}'${filterConditions}
      GROUP BY ${dateCol}
      ORDER BY ${dateCol}
    `
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      table = 'risk_mv',
      fieldName = 'funding_amount',
      groupBy,
      asOfDate,
      filters = []
    } = body
    
    // Validate inputs
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      )
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(fieldName)) {
      return NextResponse.json(
        { error: 'Invalid field name' },
        { status: 400 }
      )
    }
    
    if (groupBy && !/^[a-zA-Z0-9_]+$/.test(groupBy)) {
      return NextResponse.json(
        { error: 'Invalid groupBy field' },
        { status: 400 }
      )
    }
    
    const cacheService = getClickHouseCacheService(300)
    
    // Use asOfDate as base date, or default to today
    const baseDate = asOfDate || formatDate(new Date())
    
    // Find closest available date
    const actualBaseDate = await findClosestDate(baseDate, table)
    
    // Build and execute query
    const query = buildHistoricalQuery(
      table,
      fieldName,
      groupBy,
      actualBaseDate,
      filters
    )
    
    console.log(`Historical query for ${table}: ${query}`)
    
    // Generate cache key
    const filterHash = Buffer.from(JSON.stringify(filters || [])).toString('base64')
    const cacheKey = `historical:${table}:${fieldName}:${groupBy || 'none'}:${actualBaseDate}:${filterHash}`
    
    const result = await cacheService.query<{
      asOfDate: string
      [key: string]: any
    }>(query, undefined, cacheKey, 300)
    
    return NextResponse.json({
      data: result,
      meta: {
        table,
        fieldName,
        groupBy: groupBy || null,
        baseDate: actualBaseDate,
        recordCount: result.length
      }
    })
    
  } catch (error) {
    console.error('Historical data API error:', error)
    
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