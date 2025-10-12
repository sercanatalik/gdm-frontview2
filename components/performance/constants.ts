import type { Desk, PnlData } from "./types"

// Default data structure for fallback or when no data is available
export const defaultDesks: Desk[] = [
  {
    key: "equity",
    name: "Structured Equity Products",
    color: "#2f3945",
    rwa: 12.4,
    ytd: 8.7,
    aop: 104,
    regions: [
      { name: "EMEA", rwa: 13.1, ytd: 9.2, aop: 106 },
      { name: "Americas", rwa: 11.8, ytd: 8.3, aop: 103 },
      { name: "APAC", rwa: 12.2, ytd: 8.6, aop: 102 },
    ],
  },
  {
    key: "cash",
    name: "Cash Financing Sol",
    color: "#4b5563",
    rwa: 9.1,
    ytd: 6.3,
    aop: 99,
    regions: [
      { name: "EMEA", rwa: 9.8, ytd: 6.9, aop: 101 },
      { name: "Americas", rwa: 8.5, ytd: 5.8, aop: 97 },
    ],
  },
  {
    key: "index",
    name: "Structured Index Products",
    color: "#5b6471",
    rwa: 10.7,
    ytd: 7.9,
    aop: 101,
    regions: [
      { name: "EMEA", rwa: 11.3, ytd: 8.4, aop: 103 },
      { name: "Americas", rwa: 10.1, ytd: 7.5, aop: 99 },
      { name: "APAC", rwa: 10.9, ytd: 7.8, aop: 101 },
    ],
  },
  {
    key: "commodity",
    name: "Structured Commodity Products",
    color: "#9aa3ae",
    rwa: 6.2,
    ytd: 4.1,
    aop: 92,
    regions: [
      { name: "EMEA", rwa: 6.8, ytd: 4.5, aop: 94 },
      { name: "Americas", rwa: 5.7, ytd: 3.8, aop: 90 },
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
