import { ClickHouseClient } from './clickhouse'
import { RedisClient } from './redis'
import { ClickHouseCacheService } from './clickhouse-cache'

declare global {
  // eslint-disable-next-line no-var
  var __clickhouse_client: ClickHouseClient | undefined
  // eslint-disable-next-line no-var
  var __redis_client: RedisClient | undefined
  // eslint-disable-next-line no-var
  var __clickhouse_cache_service: ClickHouseCacheService | undefined
}

export {}