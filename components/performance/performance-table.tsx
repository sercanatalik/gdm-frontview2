import type { JSX } from "react"
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
import type { PerformanceNode, PerformanceTableColumn } from "./types"
import { filtersStore, filtersActions } from "@/lib/store/filters"
import { nanoid } from "nanoid"

const baseMetricClass = (row: PerformanceNode, levelClasses: { parent: string; child: string }) =>
  row.level === 0 ? levelClasses.parent : levelClasses.child

const metricTone = (value: number, row: PerformanceNode, tones: { parent: [string, string]; child: [string, string] }) => {
  if (row.isSummary) {
    return row.level === 0 ? "text-slate-900" : "text-slate-700"
  }
  const [positiveParent, negativeParent] = tones.parent
  const [positiveChild, negativeChild] = tones.child
  if (row.level === 0) {
    return value >= 0 ? positiveParent : negativeParent
  }
  return value >= 0 ? positiveChild : negativeChild
}

export const createDefaultPerformanceColumns = (
  primaryLabel: string,
  secondaryLabel: string
): PerformanceTableColumn<PerformanceNode>[] => [
  {
    key: "name",
    label: `${primaryLabel} / ${secondaryLabel}`,
    headerClassName: "w-[260px] min-w-[200px] text-slate-600",
    cell: {
      className: (row) => (row.level === 0 ? "text-[15px]" : "text-sm text-slate-600"),
      render: (row) => (
        <div className={cn("flex items-start gap-3", row.level === 0 ? "" : "pl-9") }>
          {row.level === 0 && !row.isSummary ? (
            <span aria-hidden className="mt-1 size-3 rounded-full" style={{ backgroundColor: row.color }} />
          ) : null}
          <span
            className={cn(
              row.level === 0 ? "font-medium text-slate-900" : "text-slate-600",
              row.isSummary ? "font-semibold text-slate-900" : ""
            )}
          >
            {row.name}
          </span>
        </div>
      ),
    },
  },
  {
    key: "mtd",
    label: "MTD",
    headerClassName: "text-slate-600 text-right",
    cell: {
      className: (row) => cn(
        baseMetricClass(row, { parent: "text-[15px]", child: "text-sm" }),
        "text-right tabular-nums",
        metricTone(row.mtd, row, {
          parent: ["text-green-700", "text-red-700"],
          child: ["text-green-600", "text-red-600"],
        })
      ),
      render: (row) => fmtCurrency(row.mtd),
    },
  },
  {
    key: "mtdPlan",
    label: "MTD Plan",
    headerClassName: "text-slate-600 text-right",
    cell: {
      className: (row) => cn(
        baseMetricClass(row, { parent: "text-[15px] text-slate-700", child: "text-sm text-slate-600" }),
        "text-right tabular-nums",
        row.isSummary ? "font-semibold text-slate-900" : ""
      ),
      render: (row) => fmtCurrency(row.mtdPlan),
    },
  },
  {
    key: "ytd",
    label: "YTD",
    headerClassName: "text-slate-600 text-right",
    cell: {
      className: (row) => cn(
        baseMetricClass(row, { parent: "text-[15px] font-medium", child: "text-sm" }),
        "text-right tabular-nums",
        metricTone(row.ytd, row, {
          parent: ["text-green-700", "text-red-700"],
          child: ["text-green-600", "text-red-600"],
        }),
        row.isSummary ? "font-semibold text-slate-900" : ""
      ),
      render: (row) => fmtCurrency(row.ytd),
    },
  },
  {
    key: "ytdPlan",
    label: "YTD Plan",
    headerClassName: "text-slate-600 text-right",
    cell: {
      className: (row) => cn(
        baseMetricClass(row, { parent: "text-[15px] text-slate-700", child: "text-sm text-slate-600" }),
        "text-right tabular-nums",
        row.isSummary ? "font-semibold text-slate-900" : ""
      ),
      render: (row) => fmtCurrency(row.ytdPlan),
    },
  },
  {
    key: "ytdAnnualized",
    label: "YTD Annualized",
    headerClassName: "text-slate-600 text-right",
    cell: {
      className: (row) => cn(
        baseMetricClass(row, { parent: "text-[15px] text-slate-700", child: "text-sm text-slate-600" }),
        "text-right tabular-nums",
        row.isSummary ? "font-semibold text-slate-900" : ""
      ),
      render: (row) => fmtCurrency(row.ytdAnnualized),
    },
  },
  {
    key: "rwa",
    label: "vs Plan %",
    headerClassName: "text-slate-600 text-right",
    cell: {
      className: (row) => cn(
        baseMetricClass(row, { parent: "text-[15px] font-medium", child: "text-sm" }),
        "text-right tabular-nums",
        row.isSummary
          ? "font-semibold text-slate-900"
          : row.rwa >= 100
          ? row.level === 0
            ? "text-green-700"
            : "text-green-600"
          : row.rwa >= 90
            ? row.level === 0
              ? "text-amber-700"
              : "text-amber-600"
            : row.level === 0
              ? "text-red-700"
              : "text-red-600"
      ),
      render: (row) => fmtPct(row.rwa),
    },
  },
  {
    key: "aop",
    label: "AOP %",
    headerClassName: "w-[280px] text-slate-600",
    cell: {
      className: "",
      render: (row) => <AopBar value={row.aop} className={cn(row.level === 0 ? undefined : "!gap-2", row.isSummary ? "!gap-2" : "")} />,
    },
  },
]

type PerformanceTableProps = {
  rows: PerformanceNode[]
  columns: PerformanceTableColumn<PerformanceNode>[]
  showTitle?: boolean
}

function buildRowElements(
  row: PerformanceNode,
  columns: PerformanceTableColumn<PerformanceNode>[] ,
  striped: boolean,
  onRowClick?: (row: PerformanceNode) => void
): JSX.Element[] {
  const rowHasFilters = !row.isSummary && (!!row.filters?.length || !!row.parentFilters?.length)

  const elements: JSX.Element[] = [
    (
      <TableRow
        key={row.key}
        onClick={rowHasFilters ? () => onRowClick?.(row) : undefined}
        className={cn(
          striped && !row.isSummary ? "bg-slate-50/40" : "",
          row.isSummary ? "border-t-4 border-double border-t-slate-300 bg-slate-100" : "",
          rowHasFilters ? "cursor-pointer" : ""
        )}
      >
        {columns.map((column) => {
          const className = typeof column.cell.className === "function"
            ? column.cell.className(row)
            : column.cell.className

          return (
            <TableCell key={column.key} className={cn(className, row.isSummary ? "!bg-slate-100" : "") }>
              {column.cell.render(row)}
            </TableCell>
          )
        })}
      </TableRow>
    )
  ]

  if (row.children && row.children.length > 0) {
    row.children.forEach((child) => {
      elements.push(...buildRowElements(child, columns, striped, onRowClick))
    })
  }

  return elements
}

export function PerformanceTable({ rows, columns, showTitle = true }: PerformanceTableProps) {
  const handleRowClick = (row: PerformanceNode) => {
    const filtersToApply = row.level === 0
      ? row.filters ?? []
      : row.parentFilters ?? row.filters ?? []

    if (row.isSummary || filtersToApply.length === 0) {
      return
    }

    const existingFilters = filtersStore.state.filters
    const appliedKeys = new Set(
      existingFilters.flatMap((filter) => filter.value.map((value) => `${filter.type}:${value}`))
    )

    filtersToApply.forEach(({ type, value }) => {
      const key = `${type}:${value}`

      if (appliedKeys.has(key)) {
        return
      }

      filtersActions.addFilter({
        id: nanoid(),
        type,
        operator: "is",
        value: [value],
        field: type,
      })

      appliedKeys.add(key)
    })
  }

  const tableRows = rows.flatMap((row, index) => buildRowElements(row, columns, index % 2 === 1, handleRowClick))

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
          {tableRows}
        </TableBody>
      </Table>
    </div>
  )
}
