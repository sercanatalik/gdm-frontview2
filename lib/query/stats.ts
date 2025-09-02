import { useQuery } from '@tanstack/react-query'

export interface StatMeasure {
  key: string
  label: string
  field: string
  tableName: string
  aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min' | 'countDistinct' | 'avgBy'
  weightField?: string // Required when aggregation is 'avgBy'
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

export interface GroupedStatMeasure {
  key: string
  label: string
  field: string
  tableName: string
  aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min' | 'countDistinct' | 'avgBy'
  weightField?: string // Required when aggregation is 'avgBy'
  formatter?: (value: number) => string
  icon?: React.ReactNode
  asOfDateField?: string
  result1?: {
    field: string
    aggregation: 'count' | 'countDistinct' | 'sum' | 'avg' | 'max' | 'min' | 'avgBy'
    weightField?: string // Required when aggregation is 'avgBy'
  }
  result2?: {
    field: string
    aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min' | 'countDistinct' | 'avgBy'
    weightField?: string // Required when aggregation is 'avgBy'
  }
  result3?: {
    field: string
    aggregation: 'sum' | 'count' | 'countDistinct' | 'avg' | 'max' | 'min' | 'avgBy'
    weightField?: string // Required when aggregation is 'avgBy'
  }
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  limit?: number
  additionalSelectFields?: Array<{
    field: string
    aggregation?: 'sum' | 'count' | 'countDistinct' | 'avg' | 'max' | 'min' | 'avgBy'
    weightField?: string // Required when aggregation is 'avgBy'
    alias: string
  }>
}

export interface GroupedStatData {
  groupValue: string
  current: number
  previous: number
  change: number
  changePercent: number
  counterpartyCount: number
  notionalAmount: number
  percentage: number
}


// React Query hook for fetching stats data
export const useStatsData = (
  measures: StatMeasure[],
  relativeDt: string,
  asOfDate?: string | null,
  filters: any[] = []
) => {
  return useQuery({
    queryKey: ['stats', measures.map(m => m.key), relativeDt, asOfDate, filters],
    queryFn: async () => {
      const response = await fetch('api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measures,
          relativeDt,
          asOfDate,
          filters
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats data')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(measures.length > 0 && relativeDt),
  })
}

// React Query hook for fetching grouped stats data
export const useGroupedStatsData = (
  measure: GroupedStatMeasure,
  groupBy: string,
  relativeDt: string,
  asOfDate?: string | null,
  filters: any[] = []
) => {
  return useQuery({
    queryKey: ['grouped-stats', measure.key, groupBy, relativeDt, asOfDate, filters],
    queryFn: async (): Promise<GroupedStatData[]> => {
      const response = await fetch('api/grouped-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measure,
          groupBy,
          relativeDt,
          asOfDate,
          filters
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch grouped stats data')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(measure && groupBy && relativeDt),
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