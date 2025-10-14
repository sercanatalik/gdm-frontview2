"use client"

import { useQuery } from "@tanstack/react-query"
import type { PerformanceData, PerformanceNode, PnlData, PerformanceGroupingKey } from "@/components/performance/types"
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

const DEFAULT_COLOR_PALETTE = [
  "#2f3945", "#4b5563", "#5b6471", "#9aa3ae",
  "#64748b", "#475569", "#334155", "#1e293b",
  "#0f172a", "#374151", "#6b7280", "#94a3b8"
]

const DEFAULT_GROUP_LABELS: Record<PerformanceGroupingKey, string> = {
  desk: "Desk",
  region: "Region",
  businessLine: "Business Line",
}

const DEFAULT_CHART_TITLES: Record<PerformanceGroupingKey, string> = {
  desk: "P&L by Desk",
  region: "P&L by Region",
  businessLine: "P&L by Business Line",
}

type AggregateBucket = {
  name: string
  color?: string
  mtd: number
  mtdPlan: number
  ytd: number
  ytdPlan: number
  ytdAnnualized: number
  fyPlan: number
  children: Map<string, AggregateBucket>
}

const createBucket = (name: string, color?: string): AggregateBucket => ({
  name,
  color,
  mtd: 0,
  mtdPlan: 0,
  ytd: 0,
  ytdPlan: 0,
  ytdAnnualized: 0,
  fyPlan: 0,
  children: new Map(),
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 32)

const resolveColor = (
  name: string,
  palette: string[],
  paletteIndexRef: { value: number },
  mapping: Record<string, string>,
  cache: Map<string, string>
) => {
  if (cache.has(name)) {
    return cache.get(name)!
  }
  const color = mapping[name] || palette[paletteIndexRef.value++ % palette.length]
  cache.set(name, color)
  return color
}

const bucketToNode = (
  keyPrefix: string,
  bucket: AggregateBucket,
  level: number,
  palette: string[],
  paletteIndexRef: { value: number },
  colorMap: Record<string, string>,
  colorCache: Map<string, string>,
  options?: {
    childFilter?: (name: string) => boolean
    childSort?: (a: PerformanceNode, b: PerformanceNode) => number
    childLevel?: number
    childPalette?: string[]
    childColorMap?: Record<string, string>
    childColorCache?: Map<string, string>
  }
): PerformanceNode => {
  const color = bucket.color ?? resolveColor(bucket.name, palette, paletteIndexRef, colorMap, colorCache)
  const node: PerformanceNode = {
    key: keyPrefix,
    name: bucket.name,
    color,
    level,
    mtd: bucket.mtd,
    mtdPlan: bucket.mtdPlan,
    ytd: bucket.ytd,
    ytdPlan: bucket.ytdPlan,
    ytdAnnualized: bucket.ytdAnnualized,
    rwa: bucket.ytdPlan !== 0 ? (bucket.ytd / bucket.ytdPlan) * 100 : 0,
    aop: bucket.fyPlan !== 0 ? (bucket.ytd / bucket.fyPlan) * 100 : 0,
    children: undefined,
  }

  if (bucket.children.size > 0) {
    const childPalette = options?.childPalette ?? palette
    const childColorMap = options?.childColorMap ?? colorMap
    const childColorCache = options?.childColorCache ?? colorCache
    const childLevel = options?.childLevel ?? level + 1
    const childPaletteIndex = { value: paletteIndexRef.value }

    const children = Array.from(bucket.children.entries())
      .filter(([name]) => (options?.childFilter ? options.childFilter(name) : true))
      .map(([name, childBucket]) =>
        bucketToNode(
          `${keyPrefix}_${slugify(name)}`,
          childBucket,
          childLevel,
          childPalette,
          childPaletteIndex,
          childColorMap,
          childColorCache
        )
      )
    node.children = options?.childSort ? children.sort(options.childSort) : children
  }

  return node
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
    return {
      groupings: {
        desk: { label: DEFAULT_GROUP_LABELS.desk, rows: [], chartTitle: DEFAULT_CHART_TITLES.desk, chartData: [] },
        region: { label: DEFAULT_GROUP_LABELS.region, rows: [], chartTitle: DEFAULT_CHART_TITLES.region, chartData: [] },
        businessLine: { label: DEFAULT_GROUP_LABELS.businessLine, rows: [], chartTitle: DEFAULT_CHART_TITLES.businessLine, chartData: [] },
      },
    }
  }

  const deskBuckets = new Map<string, AggregateBucket>()
  const regionBuckets = new Map<string, AggregateBucket>()
  const businessLineBuckets = new Map<string, AggregateBucket>()

  data.forEach((row) => {
    const deskName = row.hmsDesk?.trim() || "Other"
    const regionName = row.region?.trim() || row.bsRegion?.trim() || "Other"
    const tradingLocation = row.tradingLocation?.trim() || "Unknown"
    const businessLineName = row.businessLine?.trim() || "Other"

    const mtd = row.mtd || 0
    const mtdPlan = row.mtdPlan || 0
    const ytd = row.ytd || 0
    const ytdPlan = row.ytdPlan || 0
    const ytdAnnualized = row.ytdAnnualized || 0
    const fyPlan = row.fyPlan || 0

    const deskBucket = deskBuckets.get(deskName) ?? createBucket(deskName, DESK_COLORS[deskName])
    deskBucket.mtd += mtd
    deskBucket.mtdPlan += mtdPlan
    deskBucket.ytd += ytd
    deskBucket.ytdPlan += ytdPlan
    deskBucket.ytdAnnualized += ytdAnnualized
    deskBucket.fyPlan += fyPlan

    const deskChildBucket = deskBucket.children.get(tradingLocation) ?? createBucket(tradingLocation)
    deskChildBucket.mtd += mtd
    deskChildBucket.mtdPlan += mtdPlan
    deskChildBucket.ytd += ytd
    deskChildBucket.ytdPlan += ytdPlan
    deskChildBucket.ytdAnnualized += ytdAnnualized
    deskChildBucket.fyPlan += fyPlan
    deskBucket.children.set(tradingLocation, deskChildBucket)
    deskBuckets.set(deskName, deskBucket)

    const regionBucket = regionBuckets.get(regionName) ?? createBucket(regionName, REGION_COLORS[regionName])
    regionBucket.mtd += mtd
    regionBucket.mtdPlan += mtdPlan
    regionBucket.ytd += ytd
    regionBucket.ytdPlan += ytdPlan
    regionBucket.ytdAnnualized += ytdAnnualized
    regionBucket.fyPlan += fyPlan

    const regionChildBucket = regionBucket.children.get(deskName) ?? createBucket(deskName, DESK_COLORS[deskName])
    regionChildBucket.mtd += mtd
    regionChildBucket.mtdPlan += mtdPlan
    regionChildBucket.ytd += ytd
    regionChildBucket.ytdPlan += ytdPlan
    regionChildBucket.ytdAnnualized += ytdAnnualized
    regionChildBucket.fyPlan += fyPlan
    regionBucket.children.set(deskName, regionChildBucket)
    regionBuckets.set(regionName, regionBucket)

    const businessLineBucket = businessLineBuckets.get(businessLineName) ?? createBucket(businessLineName)
    businessLineBucket.mtd += mtd
    businessLineBucket.mtdPlan += mtdPlan
    businessLineBucket.ytd += ytd
    businessLineBucket.ytdPlan += ytdPlan
    businessLineBucket.ytdAnnualized += ytdAnnualized
    businessLineBucket.fyPlan += fyPlan

    const businessLineChildBucket = businessLineBucket.children.get(deskName) ?? createBucket(deskName, DESK_COLORS[deskName])
    businessLineChildBucket.mtd += mtd
    businessLineChildBucket.mtdPlan += mtdPlan
    businessLineChildBucket.ytd += ytd
    businessLineChildBucket.ytdPlan += ytdPlan
    businessLineChildBucket.ytdAnnualized += ytdAnnualized
    businessLineChildBucket.fyPlan += fyPlan
    businessLineBucket.children.set(deskName, businessLineChildBucket)
    businessLineBuckets.set(businessLineName, businessLineBucket)
  })

  const deskPaletteIndex = { value: 0 }
  const deskColorCache = new Map<string, string>()
  const deskNodes: PerformanceNode[] = Array.from(deskBuckets.entries())
    .filter(([name]) => name !== "Other" && name !== "Unknown")
    .map(([name, bucket]) => {
      const node = bucketToNode(
        slugify(name),
        bucket,
        0,
        DEFAULT_COLOR_PALETTE,
        deskPaletteIndex,
        DESK_COLORS,
        deskColorCache,
        {
          childFilter: (childName) => childName !== "Unknown",
          childSort: (a, b) => b.ytd - a.ytd,
        }
      )

      node.filters = [{ type: "hmsDesk", value: name }]

      if (node.children) {
        node.children = node.children.map((child) => ({
          ...child,
          parentFilters: [
            { type: "hmsDesk", value: name },
            { type: "tradingLocation", value: child.name },
          ],
        }))
      }

      return node
    })
    .sort((a, b) => Math.abs(b.aop) - Math.abs(a.aop))
    .slice(0, 10)

  const deskChart: PnlData[] = Array.from(deskBuckets.entries())
    .filter(([name]) => name !== "Other" && name !== "Unknown")
    .map(([name, bucket]) => ({
      key: slugify(name),
      name,
      value: bucket.ytd / 1_000_000,
      color: deskColorCache.get(name) ?? resolveColor(name, DEFAULT_COLOR_PALETTE, deskPaletteIndex, DESK_COLORS, deskColorCache),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 8)

  const regionPaletteIndex = { value: 0 }
  const regionColorCache = new Map<string, string>()
  const regionNodes: PerformanceNode[] = Array.from(regionBuckets.entries())
    .filter(([name]) => name !== "Other" && name !== "Unknown")
    .map(([name, bucket]) => {
      const node = bucketToNode(
        slugify(name),
        bucket,
        0,
        DEFAULT_COLOR_PALETTE,
        regionPaletteIndex,
        REGION_COLORS,
        regionColorCache,
        {
          childFilter: (childName) => childName !== "Other" && childName !== "Unknown",
          childSort: (a, b) => Math.abs(b.ytd) - Math.abs(a.ytd),
          childColorMap: DESK_COLORS,
          childColorCache: deskColorCache,
        }
      )

      node.filters = [{ type: "region", value: name }]

      if (node.children) {
        node.children = node.children.map((child) => ({
          ...child,
          parentFilters: [
            { type: "region", value: name },
            { type: "hmsDesk", value: child.name },
          ],
        }))
      }

      return node
    })
    .sort((a, b) => Math.abs(b.ytd) - Math.abs(a.ytd))

  const regionChart: PnlData[] = Array.from(regionBuckets.entries())
    .filter(([name]) => name !== "Other" && name !== "Unknown")
    .map(([name, bucket]) => ({
      key: slugify(name),
      name,
      value: bucket.ytd / 1_000_000,
      color: regionColorCache.get(name) ?? resolveColor(name, DEFAULT_COLOR_PALETTE, regionPaletteIndex, REGION_COLORS, regionColorCache),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  const businessLinePaletteIndex = { value: 0 }
  const businessLineColorCache = new Map<string, string>()
  const businessLineNodes: PerformanceNode[] = Array.from(businessLineBuckets.entries())
    .filter(([name]) => name !== "Other" && name !== "Unknown")
    .map(([name, bucket]) => {
      const node = bucketToNode(
        slugify(name),
        bucket,
        0,
        DEFAULT_COLOR_PALETTE,
        businessLinePaletteIndex,
        {},
        businessLineColorCache,
        {
          childFilter: (childName) => childName !== "Other" && childName !== "Unknown",
          childSort: (a, b) => Math.abs(b.ytd) - Math.abs(a.ytd),
          childColorMap: DESK_COLORS,
          childColorCache: deskColorCache,
        }
      )

      node.filters = [{ type: "businessLine", value: name }]

      if (node.children) {
        node.children = node.children.map((child) => ({
          ...child,
          parentFilters: [
            { type: "businessLine", value: name },
            { type: "hmsDesk", value: child.name },
          ],
        }))
      }

      return node
    })
    .sort((a, b) => Math.abs(b.ytd) - Math.abs(a.ytd))

  const businessLineChart: PnlData[] = Array.from(businessLineBuckets.entries())
    .filter(([name]) => name !== "Other" && name !== "Unknown")
    .map(([name, bucket]) => ({
      key: slugify(name),
      name,
      value: bucket.ytd / 1_000_000,
      color: businessLineColorCache.get(name) ?? resolveColor(name, DEFAULT_COLOR_PALETTE, businessLinePaletteIndex, {}, businessLineColorCache),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  return {
    groupings: {
      desk: {
        label: DEFAULT_GROUP_LABELS.desk,
        rows: deskNodes,
        chartTitle: DEFAULT_CHART_TITLES.desk,
        chartData: deskChart,
      },
      region: {
        label: DEFAULT_GROUP_LABELS.region,
        rows: regionNodes,
        chartTitle: DEFAULT_CHART_TITLES.region,
        chartData: regionChart,
      },
      businessLine: {
        label: DEFAULT_GROUP_LABELS.businessLine,
        rows: businessLineNodes,
        chartTitle: DEFAULT_CHART_TITLES.businessLine,
        chartData: businessLineChart,
      },
    },
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