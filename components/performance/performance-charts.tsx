import { cn } from "@/lib/utils"
import { MiniDonut } from "./mini-donut"
import type { PnlData } from "./types"

type PerformanceChartConfig = {
  title: string
  data: PnlData[]
}

type PerformanceChartsProps = {
  charts: PerformanceChartConfig[]
  isModal?: boolean
}

const MAX_SEGMENTS = 5

const normalizeChartData = (data: PnlData[]): PnlData[] => {
  if (data.length <= MAX_SEGMENTS) {
    return data
  }

  const sorted = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  const primary = sorted.slice(0, MAX_SEGMENTS - 1)
  const others = sorted.slice(MAX_SEGMENTS - 1)

  const othersValue = others.reduce((acc, item) => acc + item.value, 0)

  return [
    ...primary,
    {
      key: "others",
      name: "Others",
      value: othersValue,
      color: "#cbd5f5",
    },
  ]
}

export function PerformanceCharts({ charts, isModal = false }: PerformanceChartsProps) {
  if (!charts.length) {
    return null
  }

  return (
    <aside className={cn("space-y-10", isModal ? "mt-8" : "mt-12")}>
      <div className={cn("grid gap-8", isModal ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1") }>
        {charts.map((chart) => (
          <MiniDonut key={chart.title} title={chart.title} data={normalizeChartData(chart.data)} />
        ))}
      </div>
    </aside>
  )
}
