// Main component
export { PerformanceCard, default } from "./index"

// Sub-components
export { AopBar } from "./aop-bar"
export { MiniDonut } from "./mini-donut"
export { PerformanceTable } from "./performance-table"
export { PerformanceCharts } from "./performance-charts"

// Types
export type { RegionRow, Desk, PnlData, PerformanceData } from "./types"

// Utils
export { fmtPct, fmtUSD } from "./utils"

// Constants
export { defaultDesks, defaultPnlByDesk, defaultPnlByRegion } from "./constants"
