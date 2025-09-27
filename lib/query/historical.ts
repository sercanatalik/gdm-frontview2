import { useQuery } from '@tanstack/react-query'

export interface HistoricalDataPoint {
  asOfDate: string
  [key: string]: any
}

export interface HistoricalDataResponse {
  data: HistoricalDataPoint[]
  meta: {
    table: string
    fieldName: string
    groupBy?: string
    baseDate: string
    recordCount: number
  }
}

export interface HistoricalDataRequest {
  table?: string
  fieldName?: string
  groupBy?: string
  asOfDate?: string | null
  filters?: any[]
}

// React Query hook for fetching historical data
export const useHistoricalData = (
  request: HistoricalDataRequest
) => {
  return useQuery({
    queryKey: ['historical', request],
    queryFn: async (): Promise<HistoricalDataResponse> => {
      const response = await fetch('/gdm-frontview/api/tables/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch historical data')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(request.fieldName),
  })
}