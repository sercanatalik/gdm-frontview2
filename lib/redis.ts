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
    })
  }
  
  return globalRedisClient
}

export async function closeRedisClient(): Promise<void> {
  if (globalRedisClient) {
    await globalRedisClient.quit()
  }
}