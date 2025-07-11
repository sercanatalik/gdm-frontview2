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

    try {
      const cached = await this.redis.get(actualCacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.warn('Redis cache read failed:', error)
    }

    const result = await this.clickhouse.query({
      query,
      query_params: params,
      format: 'JSON',
    })

    const data = await result.json<T[]>()

    try {
      await this.redis.setex(actualCacheKey, cacheTTL, JSON.stringify(data))
    } catch (error) {
      console.warn('Redis cache write failed:', error)
    }

    return data
  }

  async invalidateCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } else {
        await this.redis.flushdb()
      }
    } catch (error) {
      console.warn('Cache invalidation failed:', error)
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