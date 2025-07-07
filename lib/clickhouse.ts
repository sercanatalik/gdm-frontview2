import { createClient } from '@clickhouse/client'

export interface ClickHouseConfig {
  host?: string
  port?: number
  username?: string
  password?: string
  database?: string
  protocol?: 'http' | 'https'
  max_open_connections?: number
  request_timeout?: number
  compression?: boolean
}

export class ClickHouseClient {
  private client: ReturnType<typeof createClient>
  private static instance: ClickHouseClient

  private constructor(config: ClickHouseConfig = {}) {
    this.client = createClient({
      host: config.host || process.env.CLICKHOUSE_HOST || 'localhost:8123',
      username: config.username || process.env.CLICKHOUSE_USER || 'default',
      password: config.password || process.env.CLICKHOUSE_PASSWORD || '',
      database: config.database || process.env.CLICKHOUSE_DB || 'default',
      max_open_connections: config.max_open_connections || (process.env.NODE_ENV === 'development' ? 5 : 10),
      request_timeout: config.request_timeout || 30000,
      compression: {
        request: config.compression || true,
        response: config.compression || true,
      },
    })
  }

  static getInstance(config?: ClickHouseConfig): ClickHouseClient {
    // In development mode, store instance globally to survive hot reloads
    if (process.env.NODE_ENV === 'development') {
      if (!global.__clickhouse_client) {
        global.__clickhouse_client = new ClickHouseClient(config)
      }
      return global.__clickhouse_client
    }

    if (!ClickHouseClient.instance) {
      ClickHouseClient.instance = new ClickHouseClient(config)
    }
    return ClickHouseClient.instance
  }

  async query<T = any>(
    query: string,
    params?: Record<string, any>
  ): Promise<T[]> {
    try {
      const resultSet = await this.client.query({
        query,
        query_params: params,
        format: 'JSON',
      })
      
      const data = await resultSet.json() as unknown as T[]
      return Array.isArray(data) ? data : [data as T]
    } catch (error) {
      console.error('ClickHouse query error:', error)
      throw error
    }
  }

  async insert<T = any>(
    table: string,
    data: T[]
  ): Promise<void> {
    try {
      await this.client.insert({
        table,
        values: data,
        format: 'JSONEachRow',
      })
    } catch (error) {
      console.error('ClickHouse insert error:', error)
      throw error
    }
  }

  async execute(query: string, params?: Record<string, any>): Promise<void> {
    try {
      await this.client.exec({
        query,
        query_params: params,
      })
    } catch (error) {
      console.error('ClickHouse execute error:', error)
      throw error
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping()
      return result.success
    } catch (error) {
      console.error('ClickHouse ping error:', error)
      return false
    }
  }

  async close(): Promise<void> {
    await this.client.close()
  }
}

export const clickhouseClient = ClickHouseClient.getInstance()