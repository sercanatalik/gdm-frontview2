This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## ClickHouse with Redis Caching

This project includes a ClickHouse wrapper with Redis caching to reduce database workload and improve performance.

### Environment Variables

Create a `.env.local` file with your database credentials:

```env
# ClickHouse Configuration
CLICKHOUSE_HOST=localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your_password
CLICKHOUSE_DB=default

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

### Usage Examples

```typescript
import clickhouseCacheService from '@/lib/clickhouse-cache'

// Basic query with automatic caching (5 min TTL in production, 1 min in dev)
const users = await clickhouseCacheService.query<User>(
  'SELECT * FROM users WHERE active = 1'
)

// Query with custom cache settings
const stats = await clickhouseCacheService.query<Stats>(
  'SELECT count(*) as total FROM orders WHERE date >= ?',
  { date: '2024-01-01' },
  { 
    ttl: 3600, // 1 hour cache
    cacheKey: 'orders:stats:2024' // custom cache key
  }
)

// Skip cache for real-time data
const liveData = await clickhouseCacheService.query<LiveData>(
  'SELECT * FROM live_metrics ORDER BY timestamp DESC LIMIT 10',
  {},
  { skipCache: true }
)

// Insert data with cache invalidation
await clickhouseCacheService.insert('users', [
  { id: 1, name: 'John', active: true },
  { id: 2, name: 'Jane', active: false }
], {
  invalidatePattern: 'ch:*users*' // Clear all user-related cache
})

// Execute queries with targeted cache invalidation
await clickhouseCacheService.execute(
  'UPDATE users SET active = 0 WHERE last_login < ?',
  { date: '2023-01-01' },
  {
    invalidateKeys: ['ch:active-users', 'ch:user-stats']
  }
)

// Check service health
const stats = await clickhouseCacheService.getStats()
console.log('ClickHouse connected:', stats.clickhouseConnected)
console.log('Redis connected:', stats.redisConnected)
console.log('Cache enabled:', stats.cacheEnabled)

// Clear all cache
await clickhouseCacheService.clearCache()
```

### Direct Client Usage

You can also use the individual clients directly:

```typescript
import { clickhouseClient } from '@/lib/clickhouse'
import { redisClient } from '@/lib/redis'

// Direct ClickHouse queries
const result = await clickhouseClient.query('SELECT version()')
await clickhouseClient.insert('events', eventData)

// Direct Redis operations
await redisClient.set('key', { data: 'value' }, 300) // 5 min TTL
const cached = await redisClient.get('key')
```

### Connection Management

The service uses singleton patterns optimized for development:

- **Single connection per service** - Prevents connection proliferation
- **Hot reload support** - Survives Next.js development server restarts
- **Environment-aware settings** - Reduced connection limits and TTL in development
- **Automatic reconnection** - Built-in retry logic and error handling
