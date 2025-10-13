import { Fragment } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AopBar } from "./aop-bar"
import { fmtPct, fmtCurrency } from "./utils"
import type { Desk, TradingLocationRow } from "./types"

type PerformanceTableProps = {
  desks: Desk[]
  showTitle?: boolean
}

export function PerformanceTable({ desks, showTitle = true }: PerformanceTableProps) {
  return (
    <div className="overflow-x-auto">
      {showTitle && (
        <div className="mb-3 text-xl font-semibold text-slate-900">
          Performance Review
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px] min-w-[200px] text-slate-600">HMS Desk / Trading Location</TableHead>
            <TableHead className="text-slate-600 text-right">MTD</TableHead>
            <TableHead className="text-slate-600 text-right">MTD Plan</TableHead>
            <TableHead className="text-slate-600 text-right">YTD</TableHead>
            <TableHead className="text-slate-600 text-right">YTD Plan</TableHead>
            <TableHead className="text-slate-600 text-right">YTD Annualized</TableHead>
            <TableHead className="text-slate-600 text-right">vs Plan %</TableHead>
            <TableHead className="w-[280px] text-slate-600">AOP %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {desks.map((d: Desk, di: number) => (
            <Fragment key={d.key}>
              <TableRow className={cn(di % 2 === 1 ? "bg-slate-50/40" : "")}>
                <TableCell>
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="mt-1 size-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[15px] font-medium text-slate-900">{d.name}</span>
                  </div>
                </TableCell>
                <TableCell className={cn(
                  "text-[15px] text-right tabular-nums",
                  d.mtd >= 0 ? "text-green-700" : "text-red-700"
                )}>{fmtCurrency(d.mtd)}</TableCell>
                <TableCell className="text-[15px] text-slate-700 text-right tabular-nums">
                  {fmtCurrency(d.mtdPlan)}
                </TableCell>
                <TableCell className={cn(
                  "text-[15px] text-right tabular-nums font-medium",
                  d.ytd >= 0 ? "text-green-700" : "text-red-700"
                )}>{fmtCurrency(d.ytd)}</TableCell>
                <TableCell className="text-[15px] text-slate-700 text-right tabular-nums">
                  {fmtCurrency(d.ytdPlan)}
                </TableCell>
                <TableCell className="text-[15px] text-slate-700 text-right tabular-nums">
                  {fmtCurrency(d.ytdAnnualized)}
                </TableCell>
                <TableCell className={cn(
                  "text-[15px] text-right tabular-nums font-medium",
                  d.rwa >= 100 ? "text-green-700" : d.rwa >= 90 ? "text-amber-700" : "text-red-700"
                )}>{fmtPct(d.rwa)}</TableCell>
                <TableCell>
                  <AopBar value={d.aop} />
                </TableCell>
              </TableRow>

              {d.tradingLocations.map((loc: TradingLocationRow) => (
                <TableRow key={loc.name} className={cn(di % 2 === 1 ? "bg-slate-50/40" : "")}>
                  <TableCell>
                    <div className="pl-9 text-sm text-slate-600">{loc.name}</div>
                  </TableCell>
                  <TableCell className={cn(
                    "text-sm text-right tabular-nums",
                    loc.mtd >= 0 ? "text-green-600" : "text-red-600"
                  )}>{fmtCurrency(loc.mtd)}</TableCell>
                  <TableCell className="text-sm text-slate-600 text-right tabular-nums">
                    {fmtCurrency(loc.mtdPlan)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-sm text-right tabular-nums",
                    loc.ytd >= 0 ? "text-green-600" : "text-red-600"
                  )}>{fmtCurrency(loc.ytd)}</TableCell>
                  <TableCell className="text-sm text-slate-600 text-right tabular-nums">
                    {fmtCurrency(loc.ytdPlan)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 text-right tabular-nums">
                    {fmtCurrency(loc.ytdAnnualized)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-sm text-right tabular-nums",
                    loc.rwa >= 100 ? "text-green-600" : loc.rwa >= 90 ? "text-amber-600" : "text-red-600"
                  )}>{fmtPct(loc.rwa)}</TableCell>
                  <TableCell>
                    <AopBar value={loc.aop} className="!gap-2" />
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
