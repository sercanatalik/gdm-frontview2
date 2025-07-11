import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const redis = getRedisClient()
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern') || '*'
    const key = searchParams.get('key')

    if (key) {
      // Get specific key value
      const value = await redis.get(key)
      const ttl = await redis.ttl(key)
      
      return NextResponse.json({
        success: true,
        data: {
          key,
          value: value ? JSON.parse(value) : null,
          ttl: ttl > 0 ? ttl : null,
          exists: value !== null
        }
      })
    }

    // Get all keys matching pattern
    const keys = await redis.keys(pattern)
    const pipeline = redis.pipeline()
    
    keys.forEach(key => {
      pipeline.get(key)
      pipeline.ttl(key)
    })
    
    const results = await pipeline.exec()
    
    const cacheData = keys.map((key, index) => {
      const valueResult = results?.[index * 2]
      const ttlResult = results?.[index * 2 + 1]
      
      return {
        key,
        value: valueResult?.[1] ? JSON.parse(valueResult[1] as string) : null,
        ttl: ttlResult?.[1] && (ttlResult[1] as number) > 0 ? ttlResult[1] : null,
        size: valueResult?.[1] ? Buffer.byteLength(valueResult[1] as string, 'utf8') : 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        keys: cacheData,
        total: keys.length,
        pattern
      }
    })
  } catch (error) {
    console.error('Cache GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve cache data'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = getRedisClient()
    const body = await request.json()
    const { key, value, ttl } = body

    if (!key || value === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Key and value are required'
      }, { status: 400 })
    }

    const serializedValue = JSON.stringify(value)
    
    if (ttl && ttl > 0) {
      await redis.setex(key, ttl, serializedValue)
    } else {
      await redis.set(key, serializedValue)
    }

    return NextResponse.json({
      success: true,
      data: {
        key,
        value,
        ttl: ttl || null,
        message: 'Cache entry added successfully'
      }
    })
  } catch (error) {
    console.error('Cache POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add cache entry'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const redis = getRedisClient()
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const pattern = searchParams.get('pattern')
    const action = searchParams.get('action')

    if (action === 'flush') {
      // Flush all cache
      await redis.flushdb()
      return NextResponse.json({
        success: true,
        data: {
          message: 'All cache entries cleared'
        }
      })
    }

    if (pattern && !key) {
      // Delete multiple keys matching pattern
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      
      return NextResponse.json({
        success: true,
        data: {
          deleted: keys.length,
          pattern,
          message: `Deleted ${keys.length} cache entries`
        }
      })
    }

    if (key) {
      // Delete specific key
      const result = await redis.del(key)
      
      return NextResponse.json({
        success: true,
        data: {
          key,
          deleted: result > 0,
          message: result > 0 ? 'Cache entry deleted' : 'Key not found'
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Key or pattern parameter required'
    }, { status: 400 })
  } catch (error) {
    console.error('Cache DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete cache entry'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const redis = getRedisClient()
    const body = await request.json()
    const { key, ttl } = body

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Key is required'
      }, { status: 400 })
    }

    const exists = await redis.exists(key)
    if (!exists) {
      return NextResponse.json({
        success: false,
        error: 'Key does not exist'
      }, { status: 404 })
    }

    if (ttl && ttl > 0) {
      await redis.expire(key, ttl)
    } else {
      await redis.persist(key)
    }

    return NextResponse.json({
      success: true,
      data: {
        key,
        ttl: ttl || null,
        message: ttl ? `TTL updated to ${ttl} seconds` : 'TTL removed (persistent)'
      }
    })
  } catch (error) {
    console.error('Cache PUT error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update cache entry'
    }, { status: 500 })
  }
}