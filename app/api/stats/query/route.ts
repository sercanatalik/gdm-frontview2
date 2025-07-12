import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    console.log('Received stats query:', query)
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    
    const cacheService = getClickHouseCacheService(300) // 5 minutes cache
    
    // Generate cache key based on query
    const cacheKey = `stats:${Buffer.from(query).toString('base64').slice(0, 32)}`
     
    const result = await cacheService.query<Record<string, number>>(
      query,
      undefined,
      cacheKey,
      300
    )
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Stats query error:', error)
    
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