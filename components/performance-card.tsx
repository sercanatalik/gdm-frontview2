"use client"

import { Fragment, useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { Loader2, AlertCircle, Maximize2, X, Download } from "lucide-react"
import { usePerformanceData } from "@/lib/query/performance"
import html2canvas from 'html2canvas-pro'
import * as FileSaver from "file-saver"

type RegionRow = {
  name: "EMEA" | "Americas" | "APAC"
  rwa: number
  ytd: number
  aop: number
}

type Desk = {
  key: "equity" | "cash" | "index" | "commodity"
  name: string
  color: string
  rwa: number
  ytd: number
  aop: number
  regions: RegionRow[]
}

type PerformanceCardProps = {
  asOfDate?: string
  filters?: any[]
  className?: string
}

// Default data structure for fallback or when no data is available
const defaultDesks: Desk[] = [
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

const defaultPnlByDesk = [
  { key: "equity", name: "Structured Equity Products", value: 1.2, color: "#2f3945" },
  { key: "cash", name: "Cash Financing Sol", value: 0.9, color: "#4b5563" },
  { key: "index", name: "Structured Index Products", value: 0.6, color: "#5b6471" },
  { key: "commodity", name: "Structured Commodity Products", value: 0.4, color: "#9aa3ae" },
]

const defaultPnlByRegion = [
  { key: "emea", name: "EMEA", value: 1.7, color: "#334155" },
  { key: "americas", name: "Americas", value: 1.2, color: "#475569" },
  { key: "apac", name: "APAC", value: 0.8, color: "#94a3b8" },
]

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}
function fmtUSD(m: number) {
  return `$${m.toFixed(1)}M`
}

function AopBar({ value, className }: { value: number; className?: string }) {
  const capped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-2.5 w-full rounded-full bg-slate-200">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-400"
          style={{ width: `${capped}%` }}
        />
        {/* subtle highlight toward the end for polish */}
        <div className="absolute inset-y-0 right-0 w-3 rounded-r-full bg-white/50" />
      </div>
      <div className="w-12 text-right text-[13px] font-medium text-slate-800 tabular-nums">
        {Math.round(value)}%
      </div>
    </div>
  )
}

function MiniDonut({
  title,
  data,
  noteClass,
}: {
  title: string
  data: { key: string; name: string; value: number; color: string }[]
  noteClass?: string
}) {
  return (
    <div className="rounded-lg">
      <div className="mb-3 text-[15px] font-semibold text-slate-900">{title}</div>
      <div className="grid grid-cols-[180px_1fr] items-center gap-4">
        <div className="h-[160px] w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={46}
                outerRadius={74}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={8}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className={cn("truncate text-sm text-slate-700", noteClass)}>{d.name}</span>
              <span className="text-sm text-slate-700 tabular-nums">{fmtUSD(d.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const PerformanceCard = ({ asOfDate, filters = [], className }: PerformanceCardProps) => {
  const { data, isLoading, error } = usePerformanceData(asOfDate, filters)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Use fetched data or fallback to defaults
  const desks = data?.desks ?? defaultDesks
  const pnlByDesk = data?.pnlByDesk ?? defaultPnlByDesk
  const pnlByRegion = data?.pnlByRegion ?? defaultPnlByRegion

  const handleExportPNG = useCallback(async () => {
    const targetRef = isModalOpen ? modalRef : cardRef
    if (!targetRef.current) return

    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        height: isModalOpen ? window.innerHeight * 0.9 : undefined,
        width: isModalOpen ? window.innerWidth : undefined
      })
      
      canvas.toBlob((blob) => {
        if (blob) {
          FileSaver.saveAs(blob, `performance-review-${new Date().toISOString().split('T')[0]}.png`)
        }
      })
    } catch (error) {
      console.error('Failed to export PNG:', error)
    }
  }, [isModalOpen])

  if (isLoading) {
    return (
      <Card className={cn("rounded-2xl border border-slate-200 shadow-sm", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("rounded-2xl border border-slate-200 shadow-sm", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <AlertCircle className="size-4 text-destructive" />
              <span className="text-sm text-destructive">{error?.message || 'Error loading performance data'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderContent = (isModal: boolean = false) => (
    <div className={cn("grid grid-cols-1 gap-8", isModal ? "" : "xl:grid-cols-[minmax(0,1fr)_420px]")}>
      {/* Table Section */}
      <div className="overflow-x-auto">
        {!isModal && (
          <div className="mb-3 text-xl font-semibold text-slate-900">
            Performance Review
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[360px] min-w-[260px] text-slate-600">Desk</TableHead>
              <TableHead className="text-slate-600">Return RWA</TableHead>
              <TableHead className="text-slate-600">Year to date</TableHead>
              <TableHead className="w-[340px] text-slate-600">AOP vs Plan</TableHead>
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
                  <TableCell className="text-[15px] text-slate-900">{fmtPct(d.rwa)}</TableCell>
                  <TableCell className="text-[15px] text-slate-900">{fmtPct(d.ytd)}</TableCell>
                  <TableCell>
                    <AopBar value={d.aop} />
                  </TableCell>
                </TableRow>

                {d.regions.map((r: RegionRow) => (
                  <TableRow key={r.name} className={cn(di % 2 === 1 ? "bg-slate-50/40" : "")}>
                    <TableCell>
                      <div className="pl-9 text-sm text-slate-600">{r.name}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">{fmtPct(r.rwa)}</TableCell>
                    <TableCell className="text-sm text-slate-700">{fmtPct(r.ytd)}</TableCell>
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

      {/* Charts Section */}
      <aside className={cn("space-y-10", isModal ? "mt-8" : "mt-12")}>
        <div className={cn("grid gap-8", isModal ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          <MiniDonut title="P&L by Desk" data={pnlByDesk} />
          <MiniDonut title="P&L by Region" data={pnlByRegion} />
        </div>
      </aside>
    </div>
  )

  return (
    <>
    <Card ref={cardRef} className={cn("rounded-2xl border border-slate-200 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-[4px]">
          <CardTitle>Performance Review</CardTitle>
          <p className="text-sm text-muted-foreground">
            Desk and region performance metrics with P&L breakdown
          </p>
        </div>
        <div className="flex items-center gap-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-1" 
            onClick={handleExportPNG}
          >
            <Download className="size-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-1" 
            onClick={() => setIsModalOpen(true)}
          >
            <Maximize2 className="size-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6 pt-0">
        {renderContent(false)}
      </CardContent>
    </Card>

    {/* Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent 
        ref={modalRef}
        className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]"
      >
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Performance Review</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-2" 
                onClick={handleExportPNG}
              >
                <Download className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-2" 
                onClick={() => setIsModalOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-auto">
          {renderContent(true)}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default PerformanceCard