import { createClient } from '@clickhouse/client'

export type ClickHouseClient = ReturnType<typeof createClient>

const host = process.env.CLICKHOUSE_HOST || 'localhost'
const port = parseInt(process.env.CLICKHOUSE_PORT || '8123')
const database = process.env.CLICKHOUSE_DATABASE || 'default'
const username = process.env.CLICKHOUSE_USERNAME || 'default'
const password = process.env.CLICKHOUSE_PASSWORD || ''

let globalClickHouseClient: ClickHouseClient

export function getClickHouseClient(): ClickHouseClient {
  if (!globalClickHouseClient) {
    globalClickHouseClient = createClient({
      host: `http://${host}:${port}`,
      database,
      username,
      password,
      compression: {
        response: true,
        request: true,
      },
      max_open_connections: 10,
      request_timeout: 30000,
    })
  }
  
  return globalClickHouseClient
}

export async function closeClickHouseClient(): Promise<void> {
  if (globalClickHouseClient) {
    await globalClickHouseClient.close()
  }
}