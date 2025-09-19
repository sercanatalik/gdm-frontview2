import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get('table_name')

   

    const cacheService = getClickHouseCacheService(300) // 5 minute cache for table metadata

    // Query to get table description from ClickHouse
    const query = `
      DESCRIBE TABLE ${tableName}
    `

    console.log(`Fetching description for table: ${tableName}`)

    // Generate cache key
    const cacheKey = `table-desc:${tableName}`

    const result = await cacheService.query<{
      name: string
      type: string
      default_type: string
      default_expression: string
      comment: string
      codec_expression: string
      ttl_expression: string
    }>(query, undefined, cacheKey, 300)

    return NextResponse.json({
      table: tableName,
      columns: result.map(col => ({
        name: col.name,
        type: col.type,
        default_type: col.default_type,
        default_expression: col.default_expression,
        comment: col.comment
      })),
      meta: {
        columnCount: result.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Table description API error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Table') && error.message.includes("doesn't exist")) {
        return NextResponse.json(
          { error: `Table '${request.nextUrl.searchParams.get('table_name')}' not found` },
          { status: 404 }
        )
      }

      if (error.message.includes('Unknown table')) {
        return NextResponse.json(
          { error: 'Table does not exist in the database' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}