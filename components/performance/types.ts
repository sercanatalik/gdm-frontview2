import type { ReactNode } from "react"

export type PerformanceNode = {
  key: string
  name: string
  color?: string
  filters?: { type: string; value: string }[]
  parentFilters?: { type: string; value: string }[]
  mtd: number
  mtdPlan: number
  ytd: number
  ytdPlan: number
  ytdAnnualized: number
  rwa: number
  aop: number
  level: number
  children?: PerformanceNode[]
  isSummary?: boolean
}

export type PerformanceTableCell<Row> = {
  className?: string | ((row: Row) => string | undefined)
  render: (row: Row) => ReactNode
}

export type PerformanceTableColumn<Row = PerformanceNode> = {
  key: string
  label: string
  headerClassName?: string
  cell: PerformanceTableCell<Row>
}

export type PnlData = {
  key: string
  name: string
  value: number
  color: string
}

export type PerformanceGroupingKey = "desk" | "region" | "businessLine"

export type PerformanceGroupData = {
  label: string
  rows: PerformanceNode[]
  chartTitle: string
  chartData: PnlData[]
}

export type PerformanceData = {
  groupings: Record<PerformanceGroupingKey, PerformanceGroupData>
}
