"use client"

import { useQuery } from "@tanstack/react-query"

type RegionRow = {
  name: "EMEA" | "Americas" | "APAC"
  rwa: number
  ytd: number
  aop: number
}

type Desk = {
  key: "equity" | "cash" | "index" | "commodity"
  name: string
  color: string
  rwa: number
  ytd: number
  aop: number
  regions: RegionRow[]
}

type PnlData = {
  key: string
  name: string
  value: number
  color: string
}

export type PerformanceData = {
  desks: Desk[]
  pnlByDesk: PnlData[]
  pnlByRegion: PnlData[]
}

async function fetchPerformanceData(asOfDate?: string, filters: any[] = []): Promise<PerformanceData> {
  const response = await fetch("/gdm-frontview/api/performance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      asOfDate,
      filters,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch performance data: ${response.status}`)
  }

  return response.json()
}

export function usePerformanceData(asOfDate?: string, filters: any[] = []) {
  return useQuery({
    queryKey: ["performance", asOfDate, filters],
    queryFn: () => fetchPerformanceData(asOfDate, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Always enabled, will fallback to defaults if API fails
  })
}