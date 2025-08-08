import { NextRequest, NextResponse } from "next/server"

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

type PerformanceData = {
  desks: Desk[]
  pnlByDesk: PnlData[]
  pnlByRegion: PnlData[]
}

// Generate random performance data based on filters and asOfDate
function generatePerformanceData(asOfDate?: string, filters: any[] = []): PerformanceData {
  // Base seed for consistent random data
  const seed = asOfDate ? new Date(asOfDate).getTime() : Date.now()
  const filterSeed = filters.length > 0 ? filters.map(f => f.value?.join('') || '').join('') : ''
  const combinedSeed = seed + (filterSeed.length * 1000)

  // Simple random generator with seed
  const random = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(combinedSeed + offset) * 10000
    return min + (x - Math.floor(x)) * (max - min)
  }

  const desks: Desk[] = [
    {
      key: "equity",
      name: "Structured Equity Products",
      color: "#2f3945",
      rwa: random(10, 15, 1),
      ytd: random(6, 10, 2),
      aop: random(95, 110, 3),
      regions: [
        { name: "EMEA", rwa: random(11, 16, 4), ytd: random(7, 11, 5), aop: random(98, 112, 6) },
        { name: "Americas", rwa: random(9, 14, 7), ytd: random(5, 9, 8), aop: random(92, 108, 9) },
        { name: "APAC", rwa: random(10, 15, 10), ytd: random(6, 10, 11), aop: random(96, 110, 12) },
      ],
    },
    {
      key: "cash",
      name: "Cash Financing Sol",
      color: "#4b5563",
      rwa: random(7, 12, 13),
      ytd: random(4, 8, 14),
      aop: random(90, 105, 15),
      regions: [
        { name: "EMEA", rwa: random(8, 13, 16), ytd: random(5, 9, 17), aop: random(93, 107, 18) },
        { name: "Americas", rwa: random(6, 11, 19), ytd: random(3, 7, 20), aop: random(87, 103, 21) },
      ],
    },
    {
      key: "index",
      name: "Structured Index Products",
      color: "#5b6471",
      rwa: random(8, 13, 22),
      ytd: random(5, 9, 23),
      aop: random(92, 107, 24),
      regions: [
        { name: "EMEA", rwa: random(9, 14, 25), ytd: random(6, 10, 26), aop: random(95, 109, 27) },
        { name: "Americas", rwa: random(7, 12, 28), ytd: random(4, 8, 29), aop: random(89, 105, 30) },
        { name: "APAC", rwa: random(8, 13, 31), ytd: random(5, 9, 32), aop: random(93, 107, 33) },
      ],
    },
    {
      key: "commodity",
      name: "Structured Commodity Products",
      color: "#9aa3ae",
      rwa: random(4, 9, 34),
      ytd: random(2, 6, 35),
      aop: random(85, 100, 36),
      regions: [
        { name: "EMEA", rwa: random(5, 10, 37), ytd: random(3, 7, 38), aop: random(88, 102, 39) },
        { name: "Americas", rwa: random(3, 8, 40), ytd: random(1, 5, 41), aop: random(82, 98, 42) },
      ],
    },
  ]

  // Round numbers to 1 decimal place
  desks.forEach(desk => {
    desk.rwa = Math.round(desk.rwa * 10) / 10
    desk.ytd = Math.round(desk.ytd * 10) / 10
    desk.aop = Math.round(desk.aop)
    desk.regions.forEach(region => {
      region.rwa = Math.round(region.rwa * 10) / 10
      region.ytd = Math.round(region.ytd * 10) / 10
      region.aop = Math.round(region.aop)
    })
  })

  const pnlByDesk: PnlData[] = [
    { key: "equity", name: "Structured Equity Products", value: Math.round(random(0.8, 1.6, 43) * 10) / 10, color: "#2f3945" },
    { key: "cash", name: "Cash Financing Sol", value: Math.round(random(0.6, 1.2, 44) * 10) / 10, color: "#4b5563" },
    { key: "index", name: "Structured Index Products", value: Math.round(random(0.4, 0.8, 45) * 10) / 10, color: "#5b6471" },
    { key: "commodity", name: "Structured Commodity Products", value: Math.round(random(0.2, 0.6, 46) * 10) / 10, color: "#9aa3ae" },
  ]

  const pnlByRegion: PnlData[] = [
    { key: "emea", name: "EMEA", value: Math.round(random(1.2, 2.2, 47) * 10) / 10, color: "#334155" },
    { key: "americas", name: "Americas", value: Math.round(random(0.8, 1.6, 48) * 10) / 10, color: "#475569" },
    { key: "apac", name: "APAC", value: Math.round(random(0.4, 1.2, 49) * 10) / 10, color: "#94a3b8" },
  ]

  return {
    desks,
    pnlByDesk,
    pnlByRegion,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { asOfDate, filters = [] } = body

    // Generate performance data based on parameters
    const data = generatePerformanceData(asOfDate, filters)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in performance API:", error)
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    )
  }
}