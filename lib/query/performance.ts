"use client"

import { useQuery } from "@tanstack/react-query"
import type { Filter } from "@/lib/store/filters"
import type { GroupedStatData, GroupedStatMeasure } from "./stats"
import type {
  PerformanceData,
  PerformanceGroupData,
  PerformanceGroupingKey,
  PerformanceNode,
  PnlData,
} from "@/components/performance/types"

const DESK_COLORS: Record<string, string> = {
  "Structured Equity Products": "#2f3945",
  "Cash Financing Sol": "#4b5563",
  "Structured Index Products": "#5b6471",
  "Structured Commodity Products": "#9aa3ae",
  Default: "#64748b",
}

const REGION_COLORS: Record<string, string> = {
  EMEA: "#334155",
  Americas: "#475569",
  APAC: "#94a3b8",
}

const DEFAULT_COLOR_PALETTE = [
  "#2f3945",
  "#4b5563",
  "#5b6471",
  "#9aa3ae",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
  "#0f172a",
  "#374151",
  "#6b7280",
  "#94a3b8",
]

const DEFAULT_GROUP_LABELS: Record<PerformanceGroupingKey, string> = {
  desk: "Desk",
  region: "Region",
  businessLine: "Business Line",
  hmsSL1: "HMS SL1",
  portfolioOwnerName: "Portfolio Owner",
}

const DEFAULT_CHART_TITLES: Record<PerformanceGroupingKey, string> = {
  desk: "P&L by Desk",
  region: "P&L by Region",
  businessLine: "P&L by Business Line",
  hmsSL1: "P&L by HMS SL1",
  portfolioOwnerName: "P&L by Portfolio Owner",
}

const PERFORMANCE_MEASURE: GroupedStatMeasure = {
  key: "performance-pnl",
  label: "Performance PnL",
  tableName: "pnl_eod",
  field: "ytd",
  aggregation: "sum",
  result1: {
    field: "mtd",
    aggregation: "sum",
  },
  result2: {
    field: "ytdPlan",
    aggregation: "sum",
  },
  result3: {
    field: "fyPlan",
    aggregation: "sum",
  },
  additionalSelectFields: [
    {
      field: "mtdPlan",
      aggregation: "sum",
      alias: "mtdPlan",
    },
    {
      field: "ytdAnnualized",
      aggregation: "sum",
      alias: "ytdAnnualized",
    },
  ],
  orderBy: "current",
  orderDirection: "DESC",
  limit: 100,
}

const RELATIVE_DT = "-1m"

type FilterMeta = { type: string; value: string }

type GroupingConfig = {
  groupByField: string
  filterField?: string
  excludeValues?: string[]
  colorMap?: Record<string, string>
  palette?: string[]
  child?: {
    groupByField: string
    filterField?: string
    excludeValues?: string[]
  }
}

const GROUPING_CONFIG: Record<PerformanceGroupingKey, GroupingConfig> = {
  desk: {
    groupByField: "hmsDesk",
    filterField: "hmsDesk",
    excludeValues: ["Other", "Unknown", ""],
    colorMap: DESK_COLORS,
    palette: DEFAULT_COLOR_PALETTE,
    child: {
      groupByField: "tradingLocation",
      filterField: "tradingLocation",
      excludeValues: ["Unknown", "", "Other"],
    },
  },
  region: {
    groupByField: "region",
    filterField: "region",
    excludeValues: ["Other", "Unknown", ""],
    colorMap: REGION_COLORS,
    palette: DEFAULT_COLOR_PALETTE,
    child: {
      groupByField: "hmsDesk",
      filterField: "hmsDesk",
      excludeValues: ["Other", "Unknown", ""],
    },
  },
  businessLine: {
    groupByField: "businessLine",
    filterField: "businessLine",
    excludeValues: ["Other", "Unknown", ""],
    palette: DEFAULT_COLOR_PALETTE,
    child: {
      groupByField: "hmsDesk",
      filterField: "hmsDesk",
      excludeValues: ["Other", "Unknown", ""],
    },
  },
  hmsSL1: {
    groupByField: "hmsSL1",
    filterField: "hmsSL1",
    excludeValues: ["Other", "Unknown", ""],
    palette: DEFAULT_COLOR_PALETTE,
    child: {
      groupByField: "portfolioOwnerName",
      filterField: "portfolioOwnerName",
      excludeValues: ["", "Unknown", "Other"],
    },
  },
  portfolioOwnerName: {
    groupByField: "portfolioOwnerName",
    filterField: "portfolioOwnerName",
    excludeValues: ["", "Unknown", "Other"],
    palette: DEFAULT_COLOR_PALETTE,
  },
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 32)

const normalizeValue = (value: string | null | undefined): string => value?.trim() || "Unknown"

const shouldExclude = (value: string, excludes?: string[]) => {
  if (!excludes || excludes.length === 0) {
    return false
  }
  const normalized = value.toLowerCase()
  return excludes.some((candidate) => candidate.toLowerCase() === normalized)
}

const mapFiltersForApi = (filters: Filter[]) =>
  filters.map((filter) => ({
    type: filter.type,
    operator: filter.operator,
    value: filter.value,
    field: filter.field ?? filter.type,
  }))

const createScopedFilter = (field: string, value: string): Filter => ({
  id: `performance-${field}-${value}`,
  type: field,
  field,
  operator: "is",
  value: [value],
})

const extractMetrics = (item: GroupedStatData) => {
  const mtd = item.counterpartyCount ?? 0
  const ytd = item.current ?? 0
  const ytdPlan = item.collateralAmount ?? 0
  const fyPlan = item.result3 ?? 0
  const mtdPlan = item.extras?.mtdPlan ?? 0
  const ytdAnnualized = item.extras?.ytdAnnualized ?? 0

  return { mtd, mtdPlan, ytd, ytdPlan, fyPlan, ytdAnnualized }
}

const resolveColorFactory = (colorMap: Record<string, string> = {}, palette: string[] = DEFAULT_COLOR_PALETTE) => {
  const cache = new Map<string, string>()
  let index = 0

  return (name: string) => {
    if (colorMap[name]) {
      return colorMap[name]
    }
    if (cache.has(name)) {
      return cache.get(name) as string
    }
    const color = palette[index % palette.length]
    index += 1
    cache.set(name, color)
    return color
  }
}

async function fetchGroupedStatsData(groupBy: string, filters: Filter[], asOfDate?: string) {
  const response = await fetch("/gdm-frontview/api/grouped-stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      measure: PERFORMANCE_MEASURE,
      groupBy,
      relativeDt: RELATIVE_DT,
      asOfDate,
      filters: mapFiltersForApi(filters),
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch grouped stats for ${groupBy}`)
  }

  return (await response.json()) as GroupedStatData[]
}

const toPerformanceNode = ({
  key,
  name,
  level,
  color,
  metrics,
  filters,
  parentFilters,
  children,
}: {
  key: string
  name: string
  level: number
  color?: string
  metrics: ReturnType<typeof extractMetrics>
  filters?: FilterMeta[]
  parentFilters?: FilterMeta[]
  children?: PerformanceNode[]
}): PerformanceNode => {
  const { mtd, mtdPlan, ytd, ytdPlan, fyPlan, ytdAnnualized } = metrics

  return {
    key,
    name,
    color,
    level,
    mtd,
    mtdPlan,
    ytd,
    ytdPlan,
    ytdAnnualized,
    rwa: ytdPlan !== 0 ? (ytd / ytdPlan) * 100 : 0,
    aop: fyPlan !== 0 ? (ytd / fyPlan) * 100 : 0,
    filters,
    parentFilters,
    children,
  }
}

const buildChartData = (nodes: PerformanceNode[]): PnlData[] =>
  nodes
    .map((node) => ({
      key: node.key,
      name: node.name,
      value: node.ytd / 1_000_000,
      color: node.color ?? "#64748b",
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 8)

async function buildGroupingData(
  key: PerformanceGroupingKey,
  baseFilters: Filter[],
  asOfDate?: string
): Promise<PerformanceGroupData> {
  const config = GROUPING_CONFIG[key]
  const parentResults = await fetchGroupedStatsData(config.groupByField, baseFilters, asOfDate)

  const resolveColor = resolveColorFactory(config.colorMap, config.palette ?? DEFAULT_COLOR_PALETTE)

  const parentCandidates = parentResults
    .map((item) => {
      const name = normalizeValue(item.groupValue)
      if (shouldExclude(name, config.excludeValues)) {
        return null
      }
      const metrics = extractMetrics(item)
      const filters: FilterMeta[] = [
        {
          type: config.filterField ?? config.groupByField,
          value: name,
        },
      ]

      return { name, metrics, filters }
    })
    .filter((entry): entry is { name: string; metrics: ReturnType<typeof extractMetrics>; filters: FilterMeta[] } => entry !== null)

  const parentNodes = await Promise.all(
    parentCandidates.map(async ({ name, metrics, filters }) => {
      const color = resolveColor(name)
      const nodeKey = `${key}_${slugify(name)}`

      let children: PerformanceNode[] | undefined

      if (config.child) {
        const scopedFilter = createScopedFilter(config.filterField ?? config.groupByField, name)
        const childResults = await fetchGroupedStatsData(config.child.groupByField, [...baseFilters, scopedFilter], asOfDate)
        const childFilterType = config.child.filterField ?? config.child.groupByField

        children = childResults
          .map((child) => {
            const childName = normalizeValue(child.groupValue)
            if (shouldExclude(childName, config.child?.excludeValues)) {
              return null
            }
            const childMetrics = extractMetrics(child)
            const childFilters: FilterMeta[] = childFilterType
              ? [
                  {
                    type: childFilterType,
                    value: childName,
                  },
                ]
              : []

            return toPerformanceNode({
              key: `${nodeKey}_${slugify(childName)}`,
              name: childName,
              level: 1,
              metrics: childMetrics,
              parentFilters: filters,
              filters: childFilters,
            })
          })
          .filter((childNode): childNode is PerformanceNode => childNode !== null)
          .sort((a, b) => Math.abs(b.ytd) - Math.abs(a.ytd))
      }

      return toPerformanceNode({
        key: nodeKey,
        name,
        level: 0,
        color,
        metrics,
        filters,
        children,
      })
    })
  )

  const sortedNodes = parentNodes.sort((a, b) => Math.abs(b.ytd) - Math.abs(a.ytd))

  return {
    label: DEFAULT_GROUP_LABELS[key],
    rows: sortedNodes,
    chartTitle: DEFAULT_CHART_TITLES[key],
    chartData: buildChartData(sortedNodes),
  }
}

async function fetchPerformanceData(asOfDate?: string, filters: Filter[] = []): Promise<PerformanceData> {
  try {
    const [desk, region, businessLine, hmsSl1, portfolioOwner] = await Promise.all([
      buildGroupingData("desk", filters, asOfDate),
      buildGroupingData("region", filters, asOfDate),
      buildGroupingData("businessLine", filters, asOfDate),
      buildGroupingData("hmsSL1", filters, asOfDate),
      buildGroupingData("portfolioOwnerName", filters, asOfDate),
    ])

    return {
      groupings: {
        desk,
        region,
        businessLine,
        hmsSL1: hmsSl1,
        portfolioOwnerName: portfolioOwner,
      },
    }
  } catch (error) {
    console.error("Failed to load performance data", error)
    return {
      groupings: {
        desk: {
          label: DEFAULT_GROUP_LABELS.desk,
          rows: [],
          chartTitle: DEFAULT_CHART_TITLES.desk,
          chartData: [],
        },
        region: {
          label: DEFAULT_GROUP_LABELS.region,
          rows: [],
          chartTitle: DEFAULT_CHART_TITLES.region,
          chartData: [],
        },
        businessLine: {
          label: DEFAULT_GROUP_LABELS.businessLine,
          rows: [],
          chartTitle: DEFAULT_CHART_TITLES.businessLine,
          chartData: [],
        },
        hmsSL1: {
          label: DEFAULT_GROUP_LABELS.hmsSL1,
          rows: [],
          chartTitle: DEFAULT_CHART_TITLES.hmsSL1,
          chartData: [],
        },
        portfolioOwnerName: {
          label: DEFAULT_GROUP_LABELS.portfolioOwnerName,
          rows: [],
          chartTitle: DEFAULT_CHART_TITLES.portfolioOwnerName,
          chartData: [],
        },
      },
    }
  }
}

export function usePerformanceData(asOfDate?: string, filters: Filter[] = []) {
  return useQuery({
    queryKey: [
      "performance",
      asOfDate ?? null,
      filters.map((filter) => ({
        type: filter.type,
        operator: filter.operator,
        value: [...filter.value],
        field: filter.field ?? filter.type,
      })),
    ],
    queryFn: () => fetchPerformanceData(asOfDate, filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: true,
  })
}
