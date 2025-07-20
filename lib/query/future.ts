import { useQuery } from '@tanstack/react-query'

export interface FutureDataPoint {
  asOfDate: string
  value: number
  monthly_value: number
  [key: string]: any
}

export interface FutureDataResponse {
  data: FutureDataPoint[]
  meta: {
    table: string
    fieldName: string
    groupBy?: string
    fromDate: string
    recordCount: number
  }
}

export interface FutureDataRequest {
  table?: string
  fieldName?: string
  groupBy?: string
  asOfDate?: string | null
  filters?: any[]
}

// React Query hook for fetching future data
export const useFutureData = (
  request: FutureDataRequest
) => {
  return useQuery({
    queryKey: ['future', request],
    queryFn: async (): Promise<FutureDataResponse> => {
      const response = await fetch('/gdm-frontview/api/tables/future', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch future data')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(request.fieldName),
  })
}