import { useQuery, keepPreviousData } from '@tanstack/react-query'

interface FilterCondition {
  type: string
  operator: string
  value: string[]
  field?: string
}

export interface Trade {
  trade_id: number
  as_of_date: string
  book_name: string
  trade_type: string
  counterparty_name: string
  start_dt: string
  maturity_dt: string
  trade_dt: string
  funding_amount: number
  collateral_amount: number
  collateral_desc: string
  collateral_type: string
  funding_spread: number
  asset_class: string
  desk: string
  trader_name: string
  book_region: string
  region_code: string
  city: string
  counterparty_type: string
  counterparty_region: string
  country: string
  rating: string
  created_at: string
  // legacy aliases for backward compatibility
  counterParty: string
  fundingAmount: number
  collateralAmount: number
  maturityDt: string
  collatCurrency: string
}

interface RecentTradesParams {
  tableName?: string
  filters?: FilterCondition[]
  limit?: number
  asOfDate?: string | null
}

interface RecentTradesResponse {
  data: Trade[]
  meta: {
    table: string
    limit: number
    recordCount: number
  }
}

async function fetchRecentTrades(params: RecentTradesParams): Promise<Trade[]> {
  const response = await fetch('/gdm-frontview/api/tables/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tableName: params.tableName  || 'risk_mv',
      limit: params.limit || 50,
      filters: params.filters || [],
      asOfDate: params.asOfDate,
      orderBy: 'trade_dt',
      orderDirection: 'DESC'
      
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || `Failed to fetch recent trades: ${response.status}`)
  }

  const result: RecentTradesResponse = await response.json()
  return result.data || []
}

export const useRecentTrades = (params?: RecentTradesParams) => {
  return useQuery<Trade[], Error>({
    queryKey: ['recent-trades', params],
    queryFn: () => fetchRecentTrades(params || {}),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    retry: 1,
    enabled: true,
  })
}

interface MaturingTradesParams {
  table?: string
  filters?: FilterCondition[]
  limit?: number
  asOfDate?: string | null
  daysAhead?: number
}

async function fetchMaturingTrades(params: MaturingTradesParams): Promise<Trade[]> {
  const today = new Date()
  const daysAhead = params.daysAhead || 30
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const maturityFilter: FilterCondition = {
    field: 'maturity_dt',
    operator: '>=',
    value: [today.toISOString().split('T')[0]],
    type: 'maturity_dt'
  }

  const maturityEndFilter: FilterCondition = {
    field: 'maturity_dt',
    operator: '<=',
    value: [futureDate.toISOString().split('T')[0]],
    type: 'maturity_dt'
  }

  const combinedFilters = [
    ...(params.filters || []),
    maturityFilter,
    maturityEndFilter
  ]

  const response = await fetch('/gdm-frontview/api/tables/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tableName: params.table || 'risk_mv',
      limit: params.limit || 500,
      filters: combinedFilters,
      asOfDate: params.asOfDate,
      orderBy: 'maturity_dt',
      orderDirection: 'ASC'
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || `Failed to fetch maturing trades: ${response.status}`)
  }

  const result = await response.json()
  return result.data || []
}

export const useTradesMaturingSoon = (params?: MaturingTradesParams) => {
  return useQuery<Trade[], Error>({
    queryKey: ['trades-maturing-soon', params],
    queryFn: () => fetchMaturingTrades(params || {}),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    retry: 1,
    enabled: true,
  })
}

export type { FilterCondition, RecentTradesParams, MaturingTradesParams }