import { useQuery } from '@tanstack/react-query'

interface TableColumn {
  name: string
  type: string
  default_type: string
  default_expression: string
  comment: string
}

interface TableDescResponse {
  table: string
  columns: TableColumn[]
  meta: {
    columnCount: number
    timestamp: string
  }
}

async function fetchTableDesc(tableName: string): Promise<TableDescResponse> {
  const response = await fetch(`/api/table-desc?table_name=${encodeURIComponent(tableName)}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch table description')
  }

  return response.json()
}

export function useTableDesc(tableName: string | undefined) {
  return useQuery<TableDescResponse, Error>({
    queryKey: ['table-desc', tableName],
    queryFn: () => fetchTableDesc(tableName!),
    enabled: !!tableName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  })
}

export function useTableColumns(tableName: string | undefined) {
  const { data, ...rest } = useTableDesc(tableName)

  return {
    columns: data?.columns || [],
    columnCount: data?.meta.columnCount || 0,
    ...rest
  }
}

export type { TableColumn, TableDescResponse }