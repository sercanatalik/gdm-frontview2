import { useQuery, keepPreviousData } from '@tanstack/react-query'

interface FilterCondition {
  type: string
  operator: string
  value: string[]
  field?: string
}

interface TableDataParams {
  tableName: string
  filters?: FilterCondition[]
  asOfDate?: string
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

interface TableDataResponse {
  data: Record<string, any>[]
  meta: {
    tableName: string
    totalRecords: number
    recordCount: number
    offset: number
    limit: number | null
    hasMore: boolean
    timestamp: string
  }
}

async function fetchTableData(params: TableDataParams): Promise<TableDataResponse> {
  const response = await fetch('/gdm-frontview/api/tables/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch table data')
  }

  return response.json()
}

export function useTableData(params: TableDataParams | null) {
  return useQuery<TableDataResponse, Error>({
    queryKey: ['table-data', params],
    queryFn: () => fetchTableData(params!),
    enabled: !!params?.tableName,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

// Hook for paginated data
export function usePaginatedTableData(
  tableName: string | undefined,
  page: number = 1,
  pageSize: number = 50,
  filters?: FilterCondition[],
  asOfDate?: string,
  orderBy?: string,
  orderDirection?: 'ASC' | 'DESC'
) {
  const params = tableName
    ? {
        tableName,
        filters,
        asOfDate,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy,
        orderDirection,
      }
    : null

  const query = useTableData(params)

  return {
    ...query,
    currentPage: page,
    totalPages: query.data ? Math.ceil(query.data.meta.totalRecords / pageSize) : 0,
    pageSize,
    totalRecords: query.data?.meta.totalRecords || 0,
    hasNextPage: query.data?.meta.hasMore || false,
    hasPreviousPage: page > 1,
  }
}

// Hook for infinite scrolling
export function useInfiniteTableData(
  tableName: string | undefined,
  pageSize: number = 50,
  filters?: FilterCondition[],
  asOfDate?: string,
  orderBy?: string,
  orderDirection?: 'ASC' | 'DESC'
) {
  const params = tableName
    ? {
        tableName,
        filters,
        asOfDate,
        limit: pageSize,
        offset: 0,
        orderBy,
        orderDirection,
      }
    : null

  return useTableData(params)
}

export type { FilterCondition, TableDataParams, TableDataResponse }