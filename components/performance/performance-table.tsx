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
import { fmtPct } from "./utils"
import type { Desk, RegionRow } from "./types"

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
            <TableHead className="w-[360px] min-w-[260px] text-slate-600">Desk / Region</TableHead>
            <TableHead className="text-slate-600 text-right">YTD vs Plan %</TableHead>
            <TableHead className="text-slate-600 text-right">YTD vs PY %</TableHead>
            <TableHead className="w-[340px] text-slate-600">AOP Achievement %</TableHead>
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
                  "text-[15px] text-right tabular-nums font-medium",
                  d.rwa >= 100 ? "text-green-700" : d.rwa >= 90 ? "text-amber-700" : "text-red-700"
                )}>{fmtPct(d.rwa)}</TableCell>
                <TableCell className={cn(
                  "text-[15px] text-right tabular-nums font-medium",
                  d.ytd >= 100 ? "text-green-700" : d.ytd >= 90 ? "text-amber-700" : "text-red-700"
                )}>{fmtPct(d.ytd)}</TableCell>
                <TableCell>
                  <AopBar value={d.aop} />
                </TableCell>
              </TableRow>

              {d.regions.map((r: RegionRow) => (
                <TableRow key={r.name} className={cn(di % 2 === 1 ? "bg-slate-50/40" : "")}>
                  <TableCell>
                    <div className="pl-9 text-sm text-slate-600">{r.name}</div>
                  </TableCell>
                  <TableCell className={cn(
                    "text-sm text-right tabular-nums",
                    r.rwa >= 100 ? "text-green-600" : r.rwa >= 90 ? "text-amber-600" : "text-red-600"
                  )}>{fmtPct(r.rwa)}</TableCell>
                  <TableCell className={cn(
                    "text-sm text-right tabular-nums",
                    r.ytd >= 100 ? "text-green-600" : r.ytd >= 90 ? "text-amber-600" : "text-red-600"
                  )}>{fmtPct(r.ytd)}</TableCell>
                  <TableCell>
                    <AopBar value={r.aop} className="!gap-2" />
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
