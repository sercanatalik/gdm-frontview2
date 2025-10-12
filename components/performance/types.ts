export type RegionRow = {
  name: "EMEA" | "Americas" | "APAC"
  rwa: number
  ytd: number
  aop: number
}

export type Desk = {
  key: "equity" | "cash" | "index" | "commodity"
  name: string
  color: string
  rwa: number
  ytd: number
  aop: number
  regions: RegionRow[]
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
