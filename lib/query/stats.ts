import { useQuery } from '@tanstack/react-query'

export interface StatMeasure {
  key: string
  label: string
  field: string
  tableName: string
  aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min'
  formatter?: (value: number) => string
  icon?: React.ReactNode
}

export interface StatConfig {
  tableName: string
  measures: StatMeasure[]
  dateField: string
}

export interface StatData {
  [key: string]: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
}


// React Query hook for fetching stats data
export const useStatsData = (
  measures: StatMeasure[],
  period: string
) => {
  return useQuery({
    queryKey: ['stats', measures.map(m => m.key), period],
    queryFn: async () => {
      const response = await fetch('/gdm-frontview/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measures,
          period
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats data')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(measures.length > 0 && period),
  })
}

// Default formatters
export const formatters = {
  currency: (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value),
  
  number: (value: number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value),
  
  percentage: (value: number) => new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100),
  
  decimal: (value: number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value),
}