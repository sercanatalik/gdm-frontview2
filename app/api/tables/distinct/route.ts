import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')
    const columnName = searchParams.get('column')
    
    // Validate required parameters
    if (!tableName || !columnName) {
      return NextResponse.json(
        { error: 'Missing required parameters: table and column' },
        { status: 400 }
      )
    }
    
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name. Only alphanumeric characters and underscores are allowed.' },
        { status: 400 }
      )
    }
    
    // Validate column name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(columnName)) {
      return NextResponse.json(
        { error: 'Invalid column name. Only alphanumeric characters and underscores are allowed.' },
        { status: 400 }
      )
    }
    
    const cacheService = getClickHouseCacheService(3600) // Cache for 1 hour
    
    // Query to get distinct values from the specified column
    const query = `
      SELECT DISTINCT ${columnName} as value
      FROM ${tableName}
      WHERE ${columnName} IS NOT NULL 
        AND ${columnName} != ''
      ORDER BY ${columnName}
      LIMIT 1000
    `
    
    // Generate cache key based on table and column
    const cacheKey = `distinct:${tableName}:${columnName}`
    
    const rows = await cacheService.query<{ value: string }>(
      query,
      undefined,
      cacheKey,
      3600
    )
    
    // Extract just the values from the result
    const distinctValues = rows.map(row => row.value)
    
    return NextResponse.json(distinctValues)
    
  } catch (error) {
    console.error('Error fetching distinct values:', error)
    
    // Return a more specific error message based on the error type
    if (error instanceof Error) {
      if (error.message.includes('Table') && error.message.includes('doesn\'t exist')) {
        return NextResponse.json(
          { error: 'Table not found' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('column') || error.message.includes('field')) {
        return NextResponse.json(
          { error: 'Column not found in table' },
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