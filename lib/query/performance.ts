"use client"

import { useQuery } from "@tanstack/react-query"
import type { PerformanceData, Desk, PnlData, TradingLocationRow } from "@/components/performance/types"
import type { Filter } from "@/lib/store/filters"

interface PnlEodRow {
  id: string
  asOfDate: string
  assetClass?: string | null
  bsRegion?: string | null
  bsSubRegion?: string | null
  businessLine?: string | null
  daily?: number | null
  dailyPlan?: number | null
  day: number
  desk?: string | null
  hmsDesk?: string | null
  deskV1?: string | null
  financing?: string | null
  fyPlan?: number | null
  mtd?: number | null
  mtdPlan?: number | null
  name?: string | null
  pnlDate: string
  portfolioOwnerName?: string | null
  prevYear?: number | null
  pyActual?: number | null
  region?: string | null
  rtn?: string | null
  hmsSL1?: string | null
  hmsSL2?: string | null
  hmsSL3?: string | null
  subDesk?: string | null
  subdeskDetails?: string | null
  subRegion?: string | null
  trading?: string | null
  tradingLocation?: string | null
  updatedAt: string
  workflowLocation?: string | null
  ytd?: number | null
  ytdPlan?: number | null
  ytdAnnualized?: number | null
}

// Color palette for desks and regions
const DESK_COLORS: Record<string, string> = {
  "Structured Equity Products": "#2f3945",
  "Cash Financing Sol": "#4b5563",
  "Structured Index Products": "#5b6471",
  "Structured Commodity Products": "#9aa3ae",
  "Default": "#64748b"
}

const REGION_COLORS: Record<string, string> = {
  "EMEA": "#334155",
  "Americas": "#475569",
  "APAC": "#94a3b8",
}

/**
 * Transforms raw PnL EOD data into performance metrics for visualization
 *
 * Data Fields Used:
 * - mtd: Month-to-date P&L
 * - mtdPlan: Month-to-date plan target
 * - ytd: Year-to-date P&L
 * - ytdPlan: Year-to-date plan target
 * - ytdAnnualized: Year-to-date annualized projection
 * - fyPlan: Full year plan target
 * - pyActual: Prior year actual (for YoY comparison)
 *
 * Display Columns:
 * - MTD: Actual month-to-date performance (in millions)
 * - MTD Plan: Month-to-date target (in millions)
 * - YTD: Actual year-to-date performance (in millions)
 * - YTD Plan: Year-to-date target (in millions)
 * - YTD Annualized: Projected annual performance based on YTD (in millions)
 * - vs Plan %: (YTD / YTD Plan) * 100 - Performance vs current plan
 * - AOP %: (YTD / FY Plan) * 100 - Progress toward annual target
 *
 * Aggregation Strategy:
 * - Groups by hmsDesk (primary desk designation)
 * - Sub-groups by tradingLocation (geographic trading location)
 * - Uses SUM aggregation for all monetary values
 * - Filters out "Other" and "Unknown" categories
 * - Shows top 10 desks by AOP achievement
 * - Shows top 8 desks in P&L charts
 */
function transformPnlDataToPerformance(data: PnlEodRow[]): PerformanceData {
  if (!data || data.length === 0) {
    return { desks: [], pnlByDesk: [], pnlByRegion: [] }
  }

  // Group data by hmsDesk and tradingLocation - use SUM for aggregation
  const deskMap = new Map<string, {
    mtdSum: number
    mtdPlanSum: number
    ytdSum: number
    ytdPlanSum: number
    ytdAnnualizedSum: number
    fyPlanSum: number
    pyActualSum: number
    tradingLocations: Map<string, {
      mtdSum: number
      mtdPlanSum: number
      ytdSum: number
      ytdPlanSum: number
      ytdAnnualizedSum: number
      fyPlanSum: number
    }>
  }>()

  const regionPnlMap = new Map<string, number>()
  const deskPnlMap = new Map<string, number>()

  // Process each row - aggregate by hmsDesk and tradingLocation
  data.forEach(row => {
    const desk = row.hmsDesk || "Other"
    const tradingLocation = row.tradingLocation || "Unknown"

    const mtd = row.mtd || 0
    const mtdPlan = row.mtdPlan || 0
    const ytd = row.ytd || 0
    const ytdPlan = row.ytdPlan || 0
    const ytdAnnualized = row.ytdAnnualized || 0
    const fyPlan = row.fyPlan || 0
    const pyActual = row.pyActual || 0

    // Aggregate by hmsDesk
    if (!deskMap.has(desk)) {
      deskMap.set(desk, {
        mtdSum: 0,
        mtdPlanSum: 0,
        ytdSum: 0,
        ytdPlanSum: 0,
        ytdAnnualizedSum: 0,
        fyPlanSum: 0,
        pyActualSum: 0,
        tradingLocations: new Map()
      })
    }

    const deskData = deskMap.get(desk)!
    deskData.mtdSum += mtd
    deskData.mtdPlanSum += mtdPlan
    deskData.ytdSum += ytd
    deskData.ytdPlanSum += ytdPlan
    deskData.ytdAnnualizedSum += ytdAnnualized
    deskData.fyPlanSum += fyPlan
    deskData.pyActualSum += pyActual

    // Aggregate by tradingLocation within desk
    if (!deskData.tradingLocations.has(tradingLocation)) {
      deskData.tradingLocations.set(tradingLocation, {
        mtdSum: 0,
        mtdPlanSum: 0,
        ytdSum: 0,
        ytdPlanSum: 0,
        ytdAnnualizedSum: 0,
        fyPlanSum: 0
      })
    }
    const locationData = deskData.tradingLocations.get(tradingLocation)!
    locationData.mtdSum += mtd
    locationData.mtdPlanSum += mtdPlan
    locationData.ytdSum += ytd
    locationData.ytdPlanSum += ytdPlan
    locationData.ytdAnnualizedSum += ytdAnnualized
    locationData.fyPlanSum += fyPlan

    // Aggregate for P&L charts
    deskPnlMap.set(desk, (deskPnlMap.get(desk) || 0) + ytd)

    // For region chart, use region or bsRegion
    const region = row.region || row.bsRegion || "Other"
    regionPnlMap.set(region, (regionPnlMap.get(region) || 0) + ytd)
  })

  // Generate color palette dynamically
  const colorPalette = [
    "#2f3945", "#4b5563", "#5b6471", "#9aa3ae",
    "#64748b", "#475569", "#334155", "#1e293b",
    "#0f172a", "#374151", "#6b7280", "#94a3b8"
  ]

  // Transform to Desk format with proper calculations
  const desks: Desk[] = Array.from(deskMap.entries())
    .map(([deskName, data], index) => {
      const { mtdSum, mtdPlanSum, ytdSum, ytdPlanSum, ytdAnnualizedSum, fyPlanSum, pyActualSum } = data

      // Calculate metrics as percentages
      // RWA = (YTD / YTD Plan) * 100
      const rwa = ytdPlanSum !== 0 ? (ytdSum / ytdPlanSum) * 100 : 0

      // YTD % vs Prior Year (kept for backward compatibility in column)
      const ytdPct = pyActualSum !== 0 ? (ytdSum / pyActualSum) * 100 : 0

      // AOP = (YTD / FY Plan) * 100 - represents progress toward annual target
      const aop = fyPlanSum !== 0 ? (ytdSum / fyPlanSum) * 100 : 0

      // Process trading locations - filter out "Unknown"
      const tradingLocations: TradingLocationRow[] = Array.from(data.tradingLocations.entries())
        .filter(([locationName]) => locationName !== "Unknown")
        .map(([locationName, locationData]) => {
          const {
            mtdSum: lMtd,
            mtdPlanSum: lMtdPlan,
            ytdSum: lYtd,
            ytdPlanSum: lYtdPlan,
            ytdAnnualizedSum: lYtdAnnualized,
            fyPlanSum: lFyPlan
          } = locationData

          return {
            name: locationName,
            mtd: lMtd,
            mtdPlan: lMtdPlan,
            ytd: lYtd,
            ytdPlan: lYtdPlan,
            ytdAnnualized: lYtdAnnualized,
            rwa: lYtdPlan !== 0 ? (lYtd / lYtdPlan) * 100 : 0,
            aop: lFyPlan !== 0 ? (lYtd / lFyPlan) * 100 : 0
          }
        })
        .sort((a, b) => b.ytd - a.ytd) // Sort by YTD descending

      // Create a key from desk name
      const key = deskName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .substring(0, 20)

      return {
        key,
        name: deskName,
        color: DESK_COLORS[deskName] || colorPalette[index % colorPalette.length],
        mtd: mtdSum,
        mtdPlan: mtdPlanSum,
        ytd: ytdSum,
        ytdPlan: ytdPlanSum,
        ytdAnnualized: ytdAnnualizedSum,
        rwa,
        aop,
        tradingLocations
      }
    })
    .filter(desk => desk.name !== "Other" && desk.name !== "Unknown") // Filter out "Other" desks
    .sort((a, b) => {
      // Sort by absolute AOP value (higher % of plan = better)
      return Math.abs(b.aop) - Math.abs(a.aop)
    })
    .slice(0, 10) // Limit to top 10 desks

  // Transform P&L data for charts - convert to millions
  const pnlByDesk: PnlData[] = Array.from(deskPnlMap.entries())
    .filter(([desk]) => desk !== "Other" && desk !== "Unknown")
    .map(([desk, value], index) => ({
      key: desk.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      name: desk,
      value: value / 1000000, // Convert to millions
      color: DESK_COLORS[desk] || colorPalette[index % colorPalette.length]
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)) // Sort by absolute value
    .slice(0, 8) // Top 8 for better visualization

  const pnlByRegion: PnlData[] = Array.from(regionPnlMap.entries())
    .filter(([region]) => region !== "Other" && region !== "Unknown")
    .map(([region, value]) => ({
      key: region.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      name: region,
      value: value / 1000000, // Convert to millions
      color: REGION_COLORS[region] || "#64748b"
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)) // Sort by absolute value

  return {
    desks,
    pnlByDesk,
    pnlByRegion
  }
}

async function fetchPerformanceData(asOfDate?: string, filters: Filter[] = []): Promise<PerformanceData> {
  const response = await fetch("/gdm-frontview/api/tables/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tableName: "pnl_eod",
      filters,
      asOfDate,
      limit: 10000, // Get enough data for aggregation
      orderBy: "ytd",
      orderDirection: "DESC"
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch performance data: ${response.status}`)
  }

  const result = await response.json()
  return transformPnlDataToPerformance(result.data)
}

export function usePerformanceData(asOfDate?: string, filters: Filter[] = []) {
  return useQuery({
    queryKey: ["performance", asOfDate, filters],
    queryFn: () => fetchPerformanceData(asOfDate, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  })
}