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

// Helper function to build future data query using maturityDt
function buildFutureQuery(
  tableName: string,
  fieldName: string,
  groupBy: string | undefined,
  fromDate: string,
  filters: FilterCondition[] = []
): string {
  const filterConditions = buildFilterConditions(filters)
  
  // Build breakdown clause for groupBy
  const breakdownClause = groupBy ? `, ${groupBy}` : ''
  const breakdownPartition = groupBy ? `PARTITION BY ${groupBy}` : ''
  
  return `
    WITH monthly_data AS (
      SELECT
        toStartOfMonth(t.maturityDt) as month_start,
        sum(toFloat64OrZero(toString(${fieldName}))) as monthly_value${breakdownClause}
      FROM ${tableName}
      WHERE t.maturityDt > '${fromDate}'${filterConditions}
      GROUP BY month_start${breakdownClause}
      ORDER BY month_start
    )
    
    SELECT
      formatDateTime(month_start, '%Y-%m-%d') as asOfDate${breakdownClause},
      sum(monthly_value) OVER (${breakdownPartition} ORDER BY month_start) as value,
      monthly_value
    FROM monthly_data
    ORDER BY month_start${breakdownClause}
  `
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
    
    // Use asOfDate as starting point for future projections, or default to today
    const fromDate = asOfDate || formatDate(new Date())
    
    // Build and execute query
    const query = buildFutureQuery(
      table,
      fieldName,
      groupBy || undefined,
      fromDate,
      filters
    )
    
    console.log(`Future query for ${table}: ${query}`)
    
    // Generate cache key
    const filterHash = Buffer.from(JSON.stringify(filters || [])).toString('base64')
    const cacheKey = `future:${table}:${fieldName}:${groupBy || 'none'}:${fromDate}:${filterHash}`
    
    const result = await cacheService.query<{
      asOfDate: string
      value: number
      monthly_value: number
      [key: string]: any
    }>(query, undefined, cacheKey, 300)
    
    return NextResponse.json({
      data: result,
      meta: {
        table,
        fieldName,
        groupBy,
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