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
