import Redis from 'ioredis'

export type RedisClient = Redis

const host = process.env.REDIS_HOST || 'localhost'
const port = parseInt(process.env.REDIS_PORT || '6379')
const password = process.env.REDIS_PASSWORD || undefined

let globalRedisClient: RedisClient

export function getRedisClient(): RedisClient {
  if (!globalRedisClient) {
    globalRedisClient = new Redis({
      host,
      port,
      password,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
    })

    // Handle connection events
    globalRedisClient.on('error', (error) => {
      console.warn('Redis connection error:', error.message)
    })

    globalRedisClient.on('connect', () => {
      console.log('Redis connected successfully')
    })

    globalRedisClient.on('ready', () => {
      console.log('Redis ready for commands')
    })
  }
  
  return globalRedisClient
}

export async function closeRedisClient(): Promise<void> {
  if (globalRedisClient) {
    await globalRedisClient.quit()
  }
}