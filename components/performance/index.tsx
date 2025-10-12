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
import { PerformanceTable } from "./performance-table"
import { PerformanceCharts } from "./performance-charts"
import { defaultDesks, defaultPnlByDesk, defaultPnlByRegion } from "./constants"
import type { Filter } from "@/lib/store/filters"

type PerformanceCardProps = {
  asOfDate?: string
  filters?: Filter[]
  className?: string
}

export const PerformanceCard = ({ asOfDate, filters = [], className }: PerformanceCardProps) => {
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
      <PerformanceTable desks={desks} showTitle={!isModal} />
      <PerformanceCharts pnlByDesk={pnlByDesk} pnlByRegion={pnlByRegion} isModal={isModal} />
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
