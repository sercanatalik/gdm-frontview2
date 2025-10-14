"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, Maximize2, X, Download } from "lucide-react"
import { usePerformanceData } from "@/lib/query/performance"
import html2canvas from 'html2canvas-pro'
import * as FileSaver from "file-saver"
import { PerformanceTable, createDefaultPerformanceColumns } from "./performance-table"
import { PerformanceCharts } from "./performance-charts"
import type { Filter } from "@/lib/store/filters"
import type { PerformanceTableColumn, PerformanceGroupingKey, PerformanceNode, PerformanceGroupData } from "./types"

type PerformanceCardProps = {
  asOfDate?: string
  filters?: Filter[]
  className?: string
  columns?: PerformanceTableColumn<PerformanceNode>[]
  groupingBy?: PerformanceGroupingKey[]
}

const DEFAULT_GROUPING_ORDER: PerformanceGroupingKey[] = ["desk", "region"]

const GROUPING_METADATA: Record<PerformanceGroupingKey, { primaryLabel: string; secondaryLabel: string }> = {

  businessLine: {
    primaryLabel: "Business Line",
    secondaryLabel: "Desk",
  },

  desk: {
    primaryLabel: "HMS Desk",
    secondaryLabel: "Trading Location",
  },
  region: {
    primaryLabel: "Region",
    secondaryLabel: "Desk",
  },
  hmsSL1: {
    primaryLabel: "HMS SL1",
    secondaryLabel: "Portfolio Owner",
  },
  portfolioOwnerName: {
    primaryLabel: "Portfolio Owner",
    secondaryLabel: "Desk",
  },
}

export const PerformanceCard = ({ asOfDate, filters = [], className, columns, groupingBy }: PerformanceCardProps) => {
  const { data, isLoading, error } = usePerformanceData(asOfDate, filters)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

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

  const groupingOrder = (groupingBy && groupingBy.length === 2
    ? groupingBy
    : DEFAULT_GROUPING_ORDER) as PerformanceGroupingKey[]

  const resolvedGroupings = groupingOrder
    .map((key, index) => {
      const fallbackKey = DEFAULT_GROUPING_ORDER[index] ?? DEFAULT_GROUPING_ORDER[0]
      const normalizedKey = GROUPING_METADATA[key] ? key : fallbackKey
      const source = data?.groupings?.[normalizedKey]
      return source ? { key: normalizedKey, data: source } : null
    })
    .filter((group): group is { key: PerformanceGroupingKey; data: PerformanceGroupData } => group !== null)

  const tableGrouping = resolvedGroupings[0]

  if (!tableGrouping || tableGrouping.data.rows.length === 0) {
    return (
      <Card className={cn("rounded-2xl border border-slate-200 shadow-sm", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="size-4" />
              <span className="text-sm">No performance data available. Please adjust your filters.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tableColumns = columns ?? createDefaultPerformanceColumns(
    GROUPING_METADATA[tableGrouping.key].primaryLabel,
    GROUPING_METADATA[tableGrouping.key].secondaryLabel
  )

  const chartEntries = [...resolvedGroupings]
  const additionalChartKeys: PerformanceGroupingKey[] = ["hmsSL1", "portfolioOwnerName"]

  additionalChartKeys.forEach((key) => {
    if (chartEntries.some((entry) => entry.key === key)) {
      return
    }

    const grouping = data?.groupings?.[key]
    if (grouping && grouping.chartData.length > 0) {
      chartEntries.push({ key, data: grouping })
    }
  })

  const chartConfigs = chartEntries
    .map(({ data }) => ({ title: data.chartTitle, data: data.chartData }))
    .filter((chart) => chart.data.length > 0)

  const businessLineTotals = data?.groupings?.businessLine?.rows ?? []
  const summaryRows = tableGrouping.key !== "businessLine"
    ? businessLineTotals.map((row) => ({
        ...row,
        key: `businessLine_total_${row.key}`,
        name: `${row.name} Total`,
        level: 0,
        children: undefined,
        isSummary: true,
      }))
    : []

  const tableRows = [...tableGrouping.data.rows, ...summaryRows]

  const renderContent = (isModal: boolean = false) => (
    <div className={cn("grid grid-cols-1 gap-8", isModal ? "" : "xl:grid-cols-[minmax(0,1fr)_420px]")}>
      <PerformanceTable rows={tableRows} columns={tableColumns} showTitle={!isModal} />
      <PerformanceCharts charts={chartConfigs} isModal={isModal} />
    </div>
  )

  return (
    <>
    <Card ref={cardRef} className={cn("rounded-2xl border border-slate-200 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-[4px]">
          <CardTitle>Performance Review</CardTitle>
          <p className="text-sm text-muted-foreground">
            Year-to-date performance vs plan and prior year, with AOP achievement tracking
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
            <div>
              <DialogTitle className="text-xl">Performance Review</DialogTitle>
              <DialogDescription>Expanded view of desk and region performance metrics</DialogDescription>
            </div>
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
