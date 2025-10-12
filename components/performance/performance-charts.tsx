import { cn } from "@/lib/utils"
import { MiniDonut } from "./mini-donut"
import type { PnlData } from "./types"

type PerformanceChartsProps = {
  pnlByDesk: PnlData[]
  pnlByRegion: PnlData[]
  isModal?: boolean
}

export function PerformanceCharts({ pnlByDesk, pnlByRegion, isModal = false }: PerformanceChartsProps) {
  return (
    <aside className={cn("space-y-10", isModal ? "mt-8" : "mt-12")}>
      <div className={cn("grid gap-8", isModal ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
        <MiniDonut title="P&L by Desk" data={pnlByDesk} />
        <MiniDonut title="P&L by Region" data={pnlByRegion} />
      </div>
    </aside>
  )
}
