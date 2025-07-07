import { ClickHouseClient } from './clickhouse'
import { RedisClient } from './redis'
import crypto from 'crypto'

export interface CacheConfig {
  defaultTtl?: number
  keyPrefix?: string
  enableCache?: boolean
}

export class ClickHouseCacheService {
  private clickhouse: ClickHouseClient
  private redis: RedisClient
  private config: CacheConfig
  private static instance: ClickHouseCacheService

  private constructor(
    clickhouse: ClickHouseClient,
    redis: RedisClient,
    config: CacheConfig = {}
  ) {
    this.clickhouse = clickhouse
    this.redis = redis
    this.config = {
      defaultTtl: config.defaultTtl || (process.env.NODE_ENV === 'development' ? 60 : 300), // Shorter TTL in dev
      keyPrefix: config.keyPrefix || 'ch:',
      enableCache: config.enableCache ?? true,
    }
  }

  static getInstance(
    clickhouse?: ClickHouseClient,
    redis?: RedisClient,
    config?: CacheConfig
  ): ClickHouseCacheService {
    // In development mode, store instance globally to survive hot reloads
    if (process.env.NODE_ENV === 'development') {
      if (!global.__clickhouse_cache_service) {
        const ch = clickhouse || ClickHouseClient.getInstance()
        const r = redis || RedisClient.getInstance()
        global.__clickhouse_cache_service = new ClickHouseCacheService(ch, r, config)
      }
      return global.__clickhouse_cache_service
    }

    if (!ClickHouseCacheService.instance) {
      const ch = clickhouse || ClickHouseClient.getInstance()
      const r = redis || RedisClient.getInstance()
      ClickHouseCacheService.instance = new ClickHouseCacheService(ch, r, config)
    }
    return ClickHouseCacheService.instance
  }

  private generateCacheKey(query: string, params?: Record<string, any>): string {
    const input = query + JSON.stringify(params || {})
    const hash = crypto.createHash('md5').update(input).digest('hex')
    return `${this.config.keyPrefix}${hash}`
  }

  async query<T = any>(
    query: string,
    params?: Record<string, any>,
    options: {
      ttl?: number
      skipCache?: boolean
      cacheKey?: string
    } = {}
  ): Promise<T[]> {
    const {
      ttl = this.config.defaultTtl,
      skipCache = false,
      cacheKey
    } = options

    const cacheTtl = ttl || this.config.defaultTtl || 300
    const key = cacheKey || this.generateCacheKey(query, params)

    // Try to get from cache first
    if (this.config.enableCache && !skipCache) {
      try {
        const cached = await this.redis.get<T[]>(key)
        if (cached) {
          console.log(`Cache hit for key: ${key}`)
          return cached
        }
      } catch (error) {
        console.warn('Cache read error, falling back to database:', error)
      }
    }

    // Query from ClickHouse
    try {
      console.log(`Cache miss for key: ${key}, querying ClickHouse`)
      const result = await this.clickhouse.query<T>(query, params)

      // Cache the result
      if (this.config.enableCache && !skipCache && cacheTtl > 0) {
        try {
          await this.redis.set(key, result, cacheTtl)
          console.log(`Cached result for key: ${key} with TTL: ${cacheTtl}s`)
        } catch (error) {
          console.warn('Cache write error:', error)
        }
      }

      return result
    } catch (error) {
      console.error('ClickHouse query failed:', error)
      throw error
    }
  }

  async insert<T = any>(
    table: string,
    data: T[],
    options: {
      invalidatePattern?: string
      invalidateKeys?: string[]
    } = {}
  ): Promise<void> {
    try {
      await this.clickhouse.insert(table, data)

      // Invalidate cache after successful insert
      if (this.config.enableCache) {
        await this.invalidateCache(options.invalidatePattern, options.invalidateKeys)
      }
    } catch (error) {
      console.error('ClickHouse insert failed:', error)
      throw error
    }
  }

  async execute(
    query: string,
    params?: Record<string, any>,
    options: {
      invalidatePattern?: string
      invalidateKeys?: string[]
    } = {}
  ): Promise<void> {
    try {
      await this.clickhouse.execute(query, params)

      // Invalidate cache after successful execution
      if (this.config.enableCache) {
        await this.invalidateCache(options.invalidatePattern, options.invalidateKeys)
      }
    } catch (error) {
      console.error('ClickHouse execute failed:', error)
      throw error
    }
  }

  async invalidateCache(
    pattern?: string,
    keys?: string[]
  ): Promise<void> {
    try {
      if (pattern) {
        const matchingKeys = await this.redis.keys(pattern)
        if (matchingKeys.length > 0) {
          await Promise.all(matchingKeys.map(key => this.redis.del(key)))
          console.log(`Invalidated ${matchingKeys.length} cache entries matching pattern: ${pattern}`)
        }
      }

      if (keys && keys.length > 0) {
        await Promise.all(keys.map(key => this.redis.del(key)))
        console.log(`Invalidated ${keys.length} specific cache keys`)
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error)
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix}*`)
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redis.del(key)))
        console.log(`Cleared ${keys.length} cache entries`)
      }
    } catch (error) {
      console.warn('Cache clear error:', error)
    }
  }

  async getStats(): Promise<{
    clickhouseConnected: boolean
    redisConnected: boolean
    cacheEnabled: boolean
  }> {
    const clickhouseConnected = await this.clickhouse.ping()
    const redisConnected = await this.redis.ping()

    return {
      clickhouseConnected,
      redisConnected,
      cacheEnabled: this.config.enableCache || false,
    }
  }

  async close(): Promise<void> {
    await Promise.all([
      this.clickhouse.close(),
      this.redis.disconnect(),
    ])
  }
}

// Create singleton instance
export const clickhouseCacheService = ClickHouseCacheService.getInstance()
export default clickhouseCacheService