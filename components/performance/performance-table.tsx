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
import type { Desk, TradingLocationRow, PerformanceTableColumn } from "./types"

export const defaultPerformanceColumns: PerformanceTableColumn[] = [
  {
    key: "name",
    label: "HMS Desk / Trading Location",
    headerClassName: "w-[260px] min-w-[200px] text-slate-600",
    deskCell: {
      render: (desk) => (
        <div className="flex items-start gap-3">
          <span aria-hidden className="mt-1 size-3 rounded-full" style={{ backgroundColor: desk.color }} />
          <span className="text-[15px] font-medium text-slate-900">{desk.name}</span>
        </div>
      ),
    },
    locationCell: {
      render: (location) => (
        <div className="pl-9 text-sm text-slate-600">{location.name}</div>
      ),
    },
  },
  {
    key: "mtd",
    label: "MTD",
    headerClassName: "text-slate-600 text-right",
    deskCell: {
      className: (desk) => cn(
        "text-[15px] text-right tabular-nums",
        desk.mtd >= 0 ? "text-green-700" : "text-red-700"
      ),
      render: (desk) => fmtCurrency(desk.mtd),
    },
    locationCell: {
      className: (location) => cn(
        "text-sm text-right tabular-nums",
        location.mtd >= 0 ? "text-green-600" : "text-red-600"
      ),
      render: (location) => fmtCurrency(location.mtd),
    },
  },
  {
    key: "mtdPlan",
    label: "MTD Plan",
    headerClassName: "text-slate-600 text-right",
    deskCell: {
      className: "text-[15px] text-slate-700 text-right tabular-nums",
      render: (desk) => fmtCurrency(desk.mtdPlan),
    },
    locationCell: {
      className: "text-sm text-slate-600 text-right tabular-nums",
      render: (location) => fmtCurrency(location.mtdPlan),
    },
  },
  {
    key: "ytd",
    label: "YTD",
    headerClassName: "text-slate-600 text-right",
    deskCell: {
      className: (desk) => cn(
        "text-[15px] text-right tabular-nums font-medium",
        desk.ytd >= 0 ? "text-green-700" : "text-red-700"
      ),
      render: (desk) => fmtCurrency(desk.ytd),
    },
    locationCell: {
      className: (location) => cn(
        "text-sm text-right tabular-nums",
        location.ytd >= 0 ? "text-green-600" : "text-red-600"
      ),
      render: (location) => fmtCurrency(location.ytd),
    },
  },
  {
    key: "ytdPlan",
    label: "YTD Plan",
    headerClassName: "text-slate-600 text-right",
    deskCell: {
      className: "text-[15px] text-slate-700 text-right tabular-nums",
      render: (desk) => fmtCurrency(desk.ytdPlan),
    },
    locationCell: {
      className: "text-sm text-slate-600 text-right tabular-nums",
      render: (location) => fmtCurrency(location.ytdPlan),
    },
  },
  {
    key: "ytdAnnualized",
    label: "YTD Annualized",
    headerClassName: "text-slate-600 text-right",
    deskCell: {
      className: "text-[15px] text-slate-700 text-right tabular-nums",
      render: (desk) => fmtCurrency(desk.ytdAnnualized),
    },
    locationCell: {
      className: "text-sm text-slate-600 text-right tabular-nums",
      render: (location) => fmtCurrency(location.ytdAnnualized),
    },
  },
  {
    key: "rwa",
    label: "vs Plan %",
    headerClassName: "text-slate-600 text-right",
    deskCell: {
      className: (desk) => cn(
        "text-[15px] text-right tabular-nums font-medium",
        desk.rwa >= 100 ? "text-green-700" : desk.rwa >= 90 ? "text-amber-700" : "text-red-700"
      ),
      render: (desk) => fmtPct(desk.rwa),
    },
    locationCell: {
      className: (location) => cn(
        "text-sm text-right tabular-nums",
        location.rwa >= 100 ? "text-green-600" : location.rwa >= 90 ? "text-amber-600" : "text-red-600"
      ),
      render: (location) => fmtPct(location.rwa),
    },
  },
  {
    key: "aop",
    label: "AOP %",
    headerClassName: "w-[280px] text-slate-600",
    deskCell: {
      render: (desk) => <AopBar value={desk.aop} />,
    },
    locationCell: {
      render: (location) => <AopBar value={location.aop} className="!gap-2" />,
    },
  },
]

type PerformanceTableProps = {
  desks: Desk[]
  showTitle?: boolean
  columns?: PerformanceTableColumn[]
}

export function PerformanceTable({ desks, showTitle = true, columns = defaultPerformanceColumns }: PerformanceTableProps) {
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
            {columns.map((column) => (
              <TableHead key={column.key} className={column.headerClassName}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {desks.map((d: Desk, di: number) => (
            <Fragment key={d.key}>
              <TableRow className={cn(di % 2 === 1 ? "bg-slate-50/40" : "")}>
                {columns.map((column) => {
                  const { deskCell } = column
                  const deskCellClass = typeof deskCell.className === "function" ? deskCell.className(d) : deskCell.className
                  return (
                    <TableCell key={column.key} className={cn(deskCellClass)}>
                      {deskCell.render(d)}
                    </TableCell>
                  )
                })}
              </TableRow>

              {d.tradingLocations.map((loc: TradingLocationRow) => (
                <TableRow key={loc.name} className={cn(di % 2 === 1 ? "bg-slate-50/40" : "")}>
                  {columns.map((column) => {
                    if (!column.locationCell) {
                      return <TableCell key={column.key} />
                    }

                    const { locationCell } = column
                    const locationCellClass = typeof locationCell.className === "function"
                      ? locationCell.className(loc)
                      : locationCell.className

                    return (
                      <TableCell key={column.key} className={cn(locationCellClass)}>
                        {locationCell.render(loc)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
