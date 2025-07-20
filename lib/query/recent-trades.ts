import { useQuery } from '@tanstack/react-query'

export interface Trade {
  id: string
  counterparty: string
  notional: number
  cashOut: number
  instrument: string
  tradeDate: string
  maturityDt: string
  desk: string
}

// React Query hook for fetching recent trades data
export const useRecentTrades = (
  filters: any[] = [],
  limit: number = 50
) => {
  return useQuery({
    queryKey: ['recent-trades', filters, limit],
    queryFn: async (): Promise<Trade[]> => {
      const response = await fetch('/gdm-frontview/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'risk_f_mv',
          limit,
          filters
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || []
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  })
}