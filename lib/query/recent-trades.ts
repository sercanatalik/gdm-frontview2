import { useQuery } from '@tanstack/react-query'

export interface Trade {
  id: string
  counterparty: string
  notional: number
  cashOut: number
  instrument: string
  tradeDt: string
  maturityDt: string
  desk: string
}

// React Query hook for fetching recent trades data
export const useRecentTrades = (
  filters: any[] = [],
  limit: number = 50,
  asOfDate?: string
) => {
  return useQuery({
    queryKey: ['recent-trades', filters, limit, asOfDate],
    queryFn: async (): Promise<Trade[]> => {
      const response = await fetch('/gdm-frontview/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'risk_f_mv',
          limit,
          filters,
          asOfDate
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

// React Query hook for fetching trades maturing soon
export const useTradesMaturingSoon = (
  filters: any[] = [],
  limit: number = 50,
  asOfDate?: string
) => {
  return useQuery({
    queryKey: ['trades-maturing-soon', filters, limit, asOfDate],
    queryFn: async (): Promise<Trade[]> => {
      // Filter for trades with future maturity dates (after today)
      const today = new Date()
      
      const maturityFilter = {
        field: 'maturityDt',
        operator: '>=',
        value: [today.toISOString().split('T')[0]],
        type: 'maturityDt'
      }
      
      const combinedFilters = [...filters, maturityFilter]

      const response = await fetch('/gdm-frontview/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'risk_f_mv',
          limit,
          filters: combinedFilters,
          asOfDate,
          orderBy: [{ column: 'maturityDt', direction: 'ASC' }]
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