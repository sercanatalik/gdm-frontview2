import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'

interface FilterCondition {
  type: string
  operator: string
  value: string[]
  field?: string
}

const formatDate = (date: Date): string => date.toISOString().split('T')[0]

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

// Helper function to find closest future date (greater than or equal to target)
const findClosestFutureDate = async (targetDate: string, tableName: string): Promise<string> => {
  const cacheService = getClickHouseCacheService(300)
  
  const query = `
    SELECT DISTINCT asOfDate
    FROM ${tableName} final
    WHERE asOfDate >= '${targetDate}'
    ORDER BY asOfDate ASC
    LIMIT 1
  `
  try {
    const result = await cacheService.query<{ asOfDate: string }>(query, undefined, `closest_future_date:${tableName}:${targetDate}`, 300)
    return result[0]?.asOfDate || targetDate
  } catch (error) {
    console.warn(`Could not find closest future date for ${targetDate} in ${tableName}, using original date`)
    return targetDate
  }
}

// Helper function to build future data query using maturityDt
function buildFutureQuery(
  tableName: string,
  fieldName: string,
  groupBy: string | undefined,
  fromDate: string,
  asOfDate: string,
  filters: FilterCondition[] = []
): string {
  const filterConditions = buildFilterConditions(filters)

  if (groupBy) {
    // Query for stacked groups - return individual group values that will be stacked
    return `
      WITH monthly_data AS (
        SELECT
          toStartOfMonth(maturityDt) as month,
          ${groupBy},
          SUM(${fieldName}) as monthly_amount
        FROM ${tableName} final
        WHERE maturityDt >= '${fromDate}'
          AND asOfDate = '${asOfDate}'${filterConditions}
        GROUP BY month, ${groupBy}
      ),
      total_per_group AS (
        SELECT
          ${groupBy},
          SUM(monthly_amount) as total
        FROM monthly_data
        GROUP BY ${groupBy}
      ),
      cumulative_data AS (
        SELECT
          m.month,
          m.${groupBy},
          m.monthly_amount,
          SUM(m.monthly_amount) OVER (PARTITION BY m.${groupBy} ORDER BY m.month ROWS UNBOUNDED PRECEDING) as cumulative_out,
          t.total - SUM(m.monthly_amount) OVER (PARTITION BY m.${groupBy} ORDER BY m.month ROWS UNBOUNDED PRECEDING) as remaining
        FROM monthly_data m
        JOIN total_per_group t ON m.${groupBy} = t.${groupBy}
      )
      SELECT
        month as maturityDt,
        ${groupBy},
        monthly_amount as ${fieldName},
        remaining as cumulative_${fieldName}
      FROM cumulative_data
      ORDER BY month, ${groupBy}
    `
  } else {
    // Query for single series - no grouping
    return `
      WITH monthly_data AS (
        SELECT
          toStartOfMonth(maturityDt) as month,
          SUM(${fieldName}) as monthly_amount
        FROM ${tableName} final
        WHERE maturityDt >= '${fromDate}'
          AND asOfDate = '${asOfDate}'${filterConditions}
        GROUP BY month
      ),
      total_amounts AS (
        SELECT
          SUM(monthly_amount) as total
        FROM monthly_data
      ),
      cumulative_data AS (
        SELECT
          m.month,
          m.monthly_amount,
          SUM(m.monthly_amount) OVER (ORDER BY m.month ROWS UNBOUNDED PRECEDING) as cumulative_out,
          t.total - SUM(m.monthly_amount) OVER (ORDER BY m.month ROWS UNBOUNDED PRECEDING) as remaining
        FROM monthly_data m
        CROSS JOIN total_amounts t
      )
      SELECT
        month as maturityDt,
        monthly_amount as ${fieldName},
        remaining as cumulative_${fieldName}
      FROM cumulative_data
      ORDER BY month
    `
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      table = 'f_exposure',
      fieldName = 'fundingAmount',
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
    
    // Use asOfDate or default to today for finding the data snapshot
    const targetAsOfDate = asOfDate || formatDate(new Date())
    
    // Find the closest available asOfDate that is >= targetAsOfDate
    const actualAsOfDate = await findClosestFutureDate(targetAsOfDate, table)
    
    // Use today as the starting point for future projections
    const fromDate = formatDate(new Date())
    
    // Build and execute query
    const query = buildFutureQuery(
      table,
      fieldName,
      groupBy || undefined,
      fromDate,
      actualAsOfDate,
      filters
    )
    
   //console.log(`Future query for ${table}: ${query}`)
    
    // Generate cache key
    const filterHash = Buffer.from(JSON.stringify(filters || [])).toString('base64')
    const cacheKey = `future:${table}:${fieldName}:${groupBy || 'none'}:${actualAsOfDate}:${fromDate}:${filterHash}`
    
    const result = await cacheService.query<{
      maturityDt: string
      [key: string]: any
    }>(query, undefined, cacheKey, 300)
    
    return NextResponse.json({
      data: result,
      meta: {
        table,
        fieldName,
        groupBy,
        asOfDate: actualAsOfDate,
        fromDate: fromDate,
        recordCount: result.length
      }
    })
    
  } catch (error) {
    console.error('Future data API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Table') && error.message.includes("doesn't exist")) {
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