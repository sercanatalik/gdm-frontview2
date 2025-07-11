import { useQuery } from '@tanstack/react-query'

export interface FilterOption {
  name: string
  icon?: React.ReactNode
}

// Query function to fetch distinct values from a table column
const fetchFilterOptions = async (tableName: string, columnName: string): Promise<FilterOption[]> => {
  const response = await fetch(`/gdm-frontview/api/tables/distinct?table=${tableName}&column=${columnName}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch filter options: ${response.statusText}`)
  }
  
  const values = await response.json()
  
  return Array.isArray(values) ? values.map((value: string) => ({
    name: value,
    icon: undefined,
  })) : []
}

// React Query hook for fetching filter options
export const useFilterOptions = (tableName: string, columnName: string) => {
  return useQuery({
    queryKey: ['filter-options', tableName, columnName],
    queryFn: () => fetchFilterOptions(tableName, columnName),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(tableName && columnName),
  })
}

// Hook to fetch multiple filter options at once
export const useMultipleFilterOptions = (
  tableName: string,
  filterTypes: Record<string, string>
) => {
  const filterKeys = Object.keys(filterTypes)
  
  const queries = filterKeys.map(key => {
    const columnName = filterTypes[key]
    return useQuery({
      queryKey: ['filter-options', tableName, columnName],
      queryFn: () => fetchFilterOptions(tableName, columnName),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      enabled: Boolean(tableName && columnName),
    })
  })

  return {
    queries,
    filterKeys,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  }
}