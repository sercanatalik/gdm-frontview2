import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'

interface FilterCondition {
  type: string
  operator: string
  value: string[]
  field?: string
}

// Helper function to build filter conditions for ClickHouse
function buildFilterConditions(filters: FilterCondition[]): string {
  if (!filters || filters.length === 0) {
    return ''
  }
  
  const conditions = filters.map(filter => {
    const { type, operator, value, field } = filter
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
      default:
        return `${fieldName} = '${value[0]}'`
    }
  }).filter(Boolean)
  
  return conditions.length > 0 ? ` AND (${conditions.join(' AND ')})` : ''
}

// Helper function to build recent trades query
function buildRecentTradesQuery(
  tableName: string,
  limit: number = 50,
  filters: FilterCondition[] = [],
  asOfDate?: string
): string {
  const filterConditions = buildFilterConditions(filters)
  const asOfDateCondition = asOfDate ? ` AND asOfDate = '${asOfDate}'` : ''
  
  return `
    SELECT
      id,
      counterparty,
      notional,
      cashOut,
      instrument,
      tradeDate,
      maturityDt,
      desk
    FROM ${tableName}
    WHERE 1=1${filterConditions}${asOfDateCondition}
    ORDER BY tradeDate DESC, id DESC
    LIMIT ${limit}
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      table = 'risk_f_mv',
      limit = 50,
      filters = [],
      asOfDate
    } = body
    
    // Validate inputs
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      )
    }
    
    if (typeof limit !== 'number' || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be a number between 1 and 1000' },
        { status: 400 }
      )
    }
    
    const cacheService = getClickHouseCacheService(60) // 1 minute cache for recent data
    
    // Build and execute query
    const query = buildRecentTradesQuery(table, limit, filters, asOfDate)
    
    console.log(`Recent trades query for ${table}: ${query}`)
    
    // Generate cache key
    const filterHash = Buffer.from(JSON.stringify(filters || [])).toString('base64')
    const asOfDateHash = asOfDate ? Buffer.from(asOfDate).toString('base64') : 'none'
    const cacheKey = `recent-trades:${table}:${limit}:${filterHash}:${asOfDateHash}`
    
    const result = await cacheService.query<{
      id: string
      counterparty: string
      notional: number
      cashOut: number
      instrument: string
      tradeDate: string
      maturityDt: string
      desk: string
    }>(query, undefined, cacheKey, 60)
    
    return NextResponse.json({
      data: result,
      meta: {
        table,
        limit,
        recordCount: result.length
      }
    })
    
  } catch (error) {
    console.error('Recent trades API error:', error)
    
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