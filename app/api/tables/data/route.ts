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
      case '>=':
        return `${fieldName} >= '${value[0]}'`
      case '<=':
        return `${fieldName} <= '${value[0]}'`
      case '>':
        return `${fieldName} > '${value[0]}'`
      case '<':
        return `${fieldName} < '${value[0]}'`
      default:
        return `${fieldName} = '${value[0]}'`
    }
  }).filter(Boolean)

  return conditions.length > 0 ? ` AND (${conditions.join(' AND ')})` : ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tableName,
      filters = [],
      asOfDate,
      limit,
      offset = 0,
      orderBy,
      orderDirection = 'ASC'
    } = body

    // Validate table name
    if (!tableName) {
      return NextResponse.json(
        { error: 'tableName is required' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name format' },
        { status: 400 }
      )
    }

    // Validate limit if provided
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 10000) {
        return NextResponse.json(
          { error: 'Invalid limit. Must be a number between 1 and 10000' },
          { status: 400 }
        )
      }
    }

    // Validate offset
    if (typeof offset !== 'number' || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset. Must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate orderDirection
    if (!['ASC', 'DESC'].includes(orderDirection.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid orderDirection. Must be ASC or DESC' },
        { status: 400 }
      )
    }

    const cacheService = getClickHouseCacheService(60) // 1 minute cache

    // Build query conditions
    const filterConditions = buildFilterConditions(filters)
    const asOfDateCondition = asOfDate ? ` AND asOfDate = '${asOfDate}'` : ''
    const limitClause = limit ? ` LIMIT ${limit}` : ''
    const offsetClause = offset > 0 ? ` OFFSET ${offset}` : ''

    // Build order by clause
    let orderByClause = ''
    if (orderBy) {
      // Validate orderBy field name
      if (!/^[a-zA-Z0-9_]+$/.test(orderBy)) {
        return NextResponse.json(
          { error: 'Invalid orderBy field name' },
          { status: 400 }
        )
      }
      orderByClause = ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`
    }

    // Build the complete query
    const query = `
      SELECT *
      FROM ${tableName}
      WHERE 1=1${filterConditions}${asOfDateCondition}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `.trim()

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${tableName}
      WHERE 1=1${filterConditions}${asOfDateCondition}
    `.trim()

    console.log(`Fetching data from table: ${tableName}`)
    console.log(`Query: ${query}`)

    // Generate cache keys
    const filterHash = Buffer.from(JSON.stringify({
      filters: filters || [],
      asOfDate: asOfDate || null,
      orderBy: orderBy || null,
      orderDirection: orderDirection || 'ASC'
    })).toString('base64')

    const dataCacheKey = `table-data:${tableName}:${limit || 'all'}:${offset}:${filterHash}`
    const countCacheKey = `table-count:${tableName}:${filterHash}`

    // Execute queries in parallel
    const [dataResult, countResult] = await Promise.all([
      cacheService.query<Record<string, any>>(query, undefined, dataCacheKey, 60),
      cacheService.query<{ total: number }>(countQuery, undefined, countCacheKey, 60)
    ])

    const totalRecords = countResult[0]?.total || 0

    return NextResponse.json({
      data: dataResult,
      meta: {
        tableName,
        totalRecords,
        recordCount: dataResult.length,
        offset,
        limit: limit || null,
        hasMore: limit ? (offset + dataResult.length) < totalRecords : false,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Table data API error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Table') && error.message.includes("doesn't exist")) {
        return NextResponse.json(
          { error: 'Table not found' },
          { status: 404 }
        )
      }

      if (error.message.includes('column') || error.message.includes('field')) {
        return NextResponse.json(
          { error: 'Invalid field or column in query' },
          { status: 400 }
        )
      }

      if (error.message.includes('Memory limit')) {
        return NextResponse.json(
          { error: 'Query exceeds memory limit. Please use filters or pagination' },
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