"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

type Row = {
  key: "equity" | "cash" | "index" | "commodity"
  desk: string
  color: string
  returnRwa: number // Return on RWA (%)
  ytd: number // Year to date performance (%)
  aop: number // Performance vs AOP plan (% of plan)
}

const rows: Row[] = [
  {
    key: "equity",
    desk: "Structured Equity Products",
    color: "#2f3945",
    returnRwa: 12.4,
    ytd: 8.7,
    aop: 104,
  },
  {
    key: "cash",
    desk: "Cash Financing Sol",
    color: "#4b5563",
    returnRwa: 9.1,
    ytd: 6.3,
    aop: 99,
  },
  {
    key: "index",
    desk: "Structured Index Products",
    color: "#5b6471",
    returnRwa: 10.7,
    ytd: 7.9,
    aop: 101,
  },
  {
    key: "commodity",
    desk: "Structured Commodity Products",
    color: "#9aa3ae",
    returnRwa: 6.2,
    ytd: 4.1,
    aop: 92,
  },
]

const fmtPct = (n: number) => `${n.toFixed(1)}%`

export default function DeskMetrics() {
  return (
    <Card className="rounded-2xl border border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Return RWA, Year to Date, and AOP performance by desk</caption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[340px] min-w-[260px] text-slate-500">
                  Desk
                </TableHead>
                <TableHead className="text-slate-500">Return RWA</TableHead>
                <TableHead className="text-slate-500">Year to date</TableHead>
                <TableHead className="text-right text-slate-500">AOP (vs plan)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key} className="align-top">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-1 size-3 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-medium text-slate-900">
                          {r.desk}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[15px] text-slate-900">
                    {fmtPct(r.returnRwa)}
                  </TableCell>
                  <TableCell className="text-[15px] text-slate-900">
                    {fmtPct(r.ytd)}
                  </TableCell>
                  <TableCell className="w-[320px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Progress
                          value={Math.min(100, r.aop)}
                          className="h-2"
                        />
                      </div>
                      <div className="w-16 text-right text-[15px] font-medium text-slate-900 tabular-nums">
                        {`${r.aop}%`}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
