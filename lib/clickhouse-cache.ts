import { getClickHouseClient, ClickHouseClient } from './clickhouse'
import { getRedisClient, RedisClient } from './redis'

export class ClickHouseCacheService {
  private clickhouse: ClickHouseClient
  private redis: RedisClient
  private defaultTTL: number

  constructor(ttl: number = 300) {
    this.clickhouse = getClickHouseClient()
    this.redis = getRedisClient()
    this.defaultTTL = ttl
  }

  async query<T = any>(
    query: string,
    params?: Record<string, any>,
    cacheKey?: string,
    ttl?: number
  ): Promise<T[]> {
    const actualCacheKey = cacheKey || this.generateCacheKey(query, params)
    const cacheTTL = ttl || this.defaultTTL

    // Try to connect and read from cache
    try {
      // Ensure Redis connection
      if (this.redis.status === 'wait') {
        await this.redis.connect()
      }
      
      if (this.redis.status === 'ready') {
        const cached = await this.redis.get(actualCacheKey)
        if (cached) {
          // console.log(`Cache HIT for key: ${actualCacheKey}`)
          return JSON.parse(cached)
        } else {
      //    console.log(`Cache MISS for key: ${actualCacheKey}`)
        }
      } else {
        console.warn(`Redis not ready. Status: ${this.redis.status}`)
      }
    } catch (error) {
      console.warn('Redis cache read failed:', error)
    }

    // Execute ClickHouse query
    const result = await this.clickhouse.query({
      query,
      query_params: params,
      format: 'JSONEachRow',
    })

    const data = await result.json<T>()

    // Try to write to cache
    try {
      if (this.redis.status === 'ready') {
        await this.redis.setex(actualCacheKey, cacheTTL, JSON.stringify(data))
        // console.log(`Cache WRITE for key: ${actualCacheKey}, TTL: ${cacheTTL}s`)
      } else {
        console.warn(`Cannot write to cache. Redis status: ${this.redis.status}`)
      }
    } catch (error) {
      console.warn('Redis cache write failed:', error)
    }

    return data
  }

  async invalidateCache(pattern?: string): Promise<void> {
    try {
      if (this.redis.status === 'ready') {
        if (pattern) {
          const keys = await this.redis.keys(pattern)
          if (keys.length > 0) {
            await this.redis.del(...keys)
          }
        } else {
          await this.redis.flushdb()
        }
      }
    } catch (error) {
      console.warn('Cache invalidation failed:', error)
    }
  }

  async getCacheStatus(): Promise<{
    redis: {
      status: string
      connected: boolean
    }
    clickhouse: {
      connected: boolean
    }
  }> {
    let redisConnected = false
    try {
      if (this.redis.status === 'ready') {
        await this.redis.ping()
        redisConnected = true
      }
    } catch (error) {
      console.warn('Redis ping failed:', error)
    }

    return {
      redis: {
        status: this.redis.status,
        connected: redisConnected,
      },
      clickhouse: {
        connected: true, // ClickHouse connection is checked when queries are made
      }
    }
  }

  private generateCacheKey(query: string, params?: Record<string, any>): string {
    const queryHash = Buffer.from(query).toString('base64')
    const paramsHash = params ? Buffer.from(JSON.stringify(params)).toString('base64') : ''
    return `ch:${queryHash}:${paramsHash}`
  }
}

let globalCacheService: ClickHouseCacheService

export function getClickHouseCacheService(ttl?: number): ClickHouseCacheService {
  if (!globalCacheService) {
    globalCacheService = new ClickHouseCacheService(ttl)
  }
  
  return globalCacheService
}

