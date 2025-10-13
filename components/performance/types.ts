import type { ReactNode } from "react"

export type TradingLocationRow = {
  name: string
  mtd: number
  mtdPlan: number
  ytd: number
  ytdPlan: number
  ytdAnnualized: number
  rwa: number
  aop: number
}

export type Desk = {
  key: string
  name: string
  color: string
  mtd: number
  mtdPlan: number
  ytd: number
  ytdPlan: number
  ytdAnnualized: number
  rwa: number
  aop: number
  tradingLocations: TradingLocationRow[]
}

export type PerformanceTableCell<Row> = {
  className?: string | ((row: Row) => string | undefined)
  render: (row: Row) => ReactNode
}

export type PerformanceTableColumn = {
  key: string
  label: string
  headerClassName?: string
  deskCell: PerformanceTableCell<Desk>
  locationCell?: PerformanceTableCell<TradingLocationRow>
}

export type PnlData = {
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
