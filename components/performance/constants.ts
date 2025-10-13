import type { Desk, PnlData } from "./types"

// Default data structure for fallback or when no data is available
export const defaultDesks: Desk[] = [
  {
    key: "structured_equity_products",
    name: "Structured Equity Products",
    color: "#2f3945",
    mtd: 15500000,
    mtdPlan: 14000000,
    ytd: 125000000,
    ytdPlan: 120000000,
    ytdAnnualized: 180000000,
    rwa: 104.2,
    aop: 104,
    tradingLocations: [
      { name: "London", mtd: 8200000, mtdPlan: 7500000, ytd: 65000000, ytdPlan: 62000000, ytdAnnualized: 95000000, rwa: 104.8, aop: 106 },
      { name: "New York", mtd: 4800000, mtdPlan: 4200000, ytd: 38000000, ytdPlan: 37000000, ytdAnnualized: 55000000, rwa: 102.7, aop: 103 },
      { name: "Hong Kong", mtd: 2500000, mtdPlan: 2300000, ytd: 22000000, ytdPlan: 21000000, ytdAnnualized: 30000000, rwa: 104.8, aop: 102 },
    ],
  },
  {
    key: "cash_financing_sol",
    name: "Cash Financing Sol",
    color: "#4b5563",
    mtd: 9200000,
    mtdPlan: 9500000,
    ytd: 85000000,
    ytdPlan: 88000000,
    ytdAnnualized: 125000000,
    rwa: 96.6,
    aop: 99,
    tradingLocations: [
      { name: "London", mtd: 5500000, mtdPlan: 5800000, ytd: 48000000, ytdPlan: 50000000, ytdAnnualized: 72000000, rwa: 96.0, aop: 101 },
      { name: "New York", mtd: 3700000, mtdPlan: 3700000, ytd: 37000000, ytdPlan: 38000000, ytdAnnualized: 53000000, rwa: 97.4, aop: 97 },
    ],
  },
  {
    key: "structured_index_products",
    name: "Structured Index Products",
    color: "#5b6471",
    mtd: 11000000,
    mtdPlan: 10500000,
    ytd: 95000000,
    ytdPlan: 92000000,
    ytdAnnualized: 138000000,
    rwa: 103.3,
    aop: 101,
    tradingLocations: [
      { name: "London", mtd: 6200000, mtdPlan: 5800000, ytd: 52000000, ytdPlan: 49000000, ytdAnnualized: 76000000, rwa: 106.1, aop: 103 },
      { name: "New York", mtd: 3200000, mtdPlan: 3300000, ytd: 28000000, ytdPlan: 28500000, ytdAnnualized: 42000000, rwa: 98.2, aop: 99 },
      { name: "Singapore", mtd: 1600000, mtdPlan: 1400000, ytd: 15000000, ytdPlan: 14500000, ytdAnnualized: 20000000, rwa: 103.4, aop: 101 },
    ],
  },
  {
    key: "structured_commodity_products",
    name: "Structured Commodity Products",
    color: "#9aa3ae",
    mtd: 5800000,
    mtdPlan: 6500000,
    ytd: 52000000,
    ytdPlan: 58000000,
    ytdAnnualized: 75000000,
    rwa: 89.7,
    aop: 92,
    tradingLocations: [
      { name: "London", mtd: 3500000, mtdPlan: 3900000, ytd: 31000000, ytdPlan: 34000000, ytdAnnualized: 44000000, rwa: 91.2, aop: 94 },
      { name: "New York", mtd: 2300000, mtdPlan: 2600000, ytd: 21000000, ytdPlan: 24000000, ytdAnnualized: 31000000, rwa: 87.5, aop: 90 },
    ],
  },
]

export const defaultPnlByDesk: PnlData[] = [
  { key: "equity", name: "Structured Equity Products", value: 1.2, color: "#2f3945" },
  { key: "cash", name: "Cash Financing Sol", value: 0.9, color: "#4b5563" },
  { key: "index", name: "Structured Index Products", value: 0.6, color: "#5b6471" },
  { key: "commodity", name: "Structured Commodity Products", value: 0.4, color: "#9aa3ae" },
]

export const defaultPnlByRegion: PnlData[] = [
  { key: "emea", name: "EMEA", value: 1.7, color: "#334155" },
  { key: "americas", name: "Americas", value: 1.2, color: "#475569" },
  { key: "apac", name: "APAC", value: 0.8, color: "#94a3b8" },
]
