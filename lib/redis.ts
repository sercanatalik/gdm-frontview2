import Redis from 'ioredis'

export interface RedisConfig {
  host?: string
  port?: number
  password?: string
  db?: number
  maxRetriesPerRequest?: number
  retryDelayOnFailover?: number
  lazyConnect?: boolean
  keyPrefix?: string
}

export class RedisClient {
  private client: Redis
  private keyPrefix: string
  private static instance: RedisClient

  private constructor(config: RedisConfig = {}) {
    this.keyPrefix = config.keyPrefix || 'gdm:'
    
    this.client = new Redis({
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || Number(process.env.REDIS_PORT) || 6379,
      password: config.password || process.env.REDIS_PASSWORD || undefined,
      db: config.db || Number(process.env.REDIS_DB) || 0,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      lazyConnect: config.lazyConnect !== false,
      family: 4,
      keepAlive: 30000,
      connectionName: `gdm-${process.env.NODE_ENV || 'development'}`,
    })

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    this.client.on('connect', () => {
      console.log('Redis connected successfully')
    })

    // Handle dev mode hot reloads
    if (process.env.NODE_ENV === 'development') {
      this.client.on('ready', () => {
        console.log('Redis ready for development')
      })
    }
  }

  static getInstance(config?: RedisConfig): RedisClient {
    // In development mode, store instance globally to survive hot reloads
    if (process.env.NODE_ENV === 'development') {
      if (!global.__redis_client) {
        global.__redis_client = new RedisClient(config)
      }
      return global.__redis_client
    }

    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(config)
    }
    return RedisClient.instance
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(this.getKey(key))
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      const fullKey = this.getKey(key)
      
      if (ttlSeconds) {
        await this.client.setex(fullKey, ttlSeconds, serialized)
      } else {
        await this.client.set(fullKey, serialized)
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const deleted = await this.client.del(this.getKey(key))
      return deleted > 0
    } catch (error) {
      console.error('Redis del error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(this.getKey(key))
      return exists === 1
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(this.getKey(key), ttlSeconds)
      return result === 1
    } catch (error) {
      console.error('Redis expire error:', error)
      return false
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await this.client.keys(this.getKey(pattern))
      return keys.map(key => key.replace(this.keyPrefix, ''))
    } catch (error) {
      console.error('Redis keys error:', error)
      return []
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.client.flushdb()
      return true
    } catch (error) {
      console.error('Redis flush error:', error)
      return false
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Redis ping error:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.client.disconnect()
  }
}

export const redisClient = RedisClient.getInstance()