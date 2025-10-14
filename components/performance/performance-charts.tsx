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

export function PerformanceCharts({ charts, isModal = false }: PerformanceChartsProps) {
  if (!charts.length) {
    return null
  }

  return (
    <aside className={cn("space-y-10", isModal ? "mt-8" : "mt-12")}>
      <div className={cn("grid gap-8", isModal ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1") }>
        {charts.map((chart) => (
          <MiniDonut key={chart.title} title={chart.title} data={chart.data} />
        ))}
      </div>
    </aside>
  )
}
