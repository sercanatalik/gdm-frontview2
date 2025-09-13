"use client"

import * as React from "react"
import { useCallback } from "react"
import { useStore } from "@tanstack/react-store"
import { Card, CardContent } from "@/components/ui/card"
import html2canvas from 'html2canvas-pro'
import * as FileSaver from "file-saver"
import { HistoricalChart, processHistoricalData } from "./cashout-chart-historical"
import { FutureChart, processFutureData } from "./cashout-chart-future"
import { FIELD_OPTIONS } from "./cashout-chart-utils"
import { filtersStore } from "@/lib/store/filters"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BarChart3, Expand, X, Settings, Download, Image } from "lucide-react"

interface CashoutChartProps {
  className?: string
}

export function CashoutChart({ className }: CashoutChartProps) {
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)
  
  // State
  const [fieldName, setFieldName] = React.useState("fundingAmount")
  const [groupBy, setGroupBy] = React.useState("none")
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("historical")
  const [exportLoading, setExportLoading] = React.useState(false)
  const [historicalData, setHistoricalData] = React.useState<any>(null)
  const [futureData, setFutureData] = React.useState<any>(null)
  
  // Refs
  const historicalChartRef = React.useRef<HTMLDivElement>(null)
  const futureChartRef = React.useRef<HTMLDivElement>(null)
  
  const chartRef = activeTab === "historical" ? historicalChartRef : futureChartRef
  
  // GroupBy options from filter config
  const groupByOptions = React.useMemo(() => [
    { value: "none", label: "None" },
    ...Object.entries(riskFilterConfig.filterTypes).map(([key, value]) => ({
      value: value,
      label: key
    }))
  ], [])

  // Export functions
  const handleDownload = useCallback(() => {
    const currentData = activeTab === "historical" ? historicalData : futureData
    if (!currentData) return
    
    const processedData = activeTab === "historical" 
      ? processHistoricalData(currentData)
      : processFutureData(currentData)
    
    const csvContent = [
      Object.keys(processedData[0]).join(','),
      ...processedData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-${fieldName}-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [historicalData, futureData, activeTab, fieldName])
  
  const handleSaveAsPng = useCallback(async () => {
    if (!chartRef.current) return
    
    setExportLoading(true)
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      })
      
      canvas.toBlob((blob) => {
        if (blob) {
          FileSaver.saveAs(blob, `${activeTab}-${fieldName}-chart.png`)
        }
        setExportLoading(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error saving chart as PNG:', error)
      alert('Unable to save chart as image. Please try again.')
      setExportLoading(false)
    }
  }, [fieldName, activeTab, chartRef])

  return (
    <div className={isFullscreen ? "fixed inset-0 bg-background z-50 flex flex-col" : ""}>
      {isFullscreen && (
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {FIELD_OPTIONS.find(f => f.value === fieldName)?.label} Chart
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
            <X className="size-4" />
          </Button>
        </div>
      )}
      
      <Card className={isFullscreen ? "flex-1 border-0 shadow-none" : className}>
        <div className="px-5 pt-0 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="historical">
                    Historical {FIELD_OPTIONS.find(f => f.value === fieldName)?.label}
                  </TabsTrigger>
                  <TabsTrigger value="future">
                    Future {FIELD_OPTIONS.find(f => f.value === fieldName)?.label}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center gap-0">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-1">
                    <Settings className="size-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Chart Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Field Name</label>
                      <Select value={fieldName} onValueChange={setFieldName}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Group By</label>
                      <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {groupByOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-1" 
                onClick={handleDownload}
              >
                <Download className="size-3" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-1" 
                onClick={handleSaveAsPng} 
                disabled={exportLoading}
              >
                <Image className="size-3" />
              </Button>
              
              {!isFullscreen && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="px-1" 
                  onClick={() => setIsFullscreen(true)}
                >
                  <Expand className="size-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="historical" className="m-0">
            <CardContent className={isFullscreen ? "pt-4 pb-8 px-0" : "pt-4 px-0"}>
              <HistoricalChart
                ref={historicalChartRef}
                fieldName={fieldName}
                groupBy={groupBy}
                filters={filters}
                asOfDate={asOfDate}
                isFullscreen={isFullscreen}
                onDataLoad={setHistoricalData}
              />
            </CardContent>
          </TabsContent>
          
          <TabsContent value="future" className="m-0">
            <CardContent className={isFullscreen ? "pt-4 pb-8 px-0" : "pt-4 px-0"}>
              <FutureChart
                ref={futureChartRef}
                fieldName={fieldName}
                groupBy={groupBy}
                filters={filters}
                asOfDate={asOfDate}
                isFullscreen={isFullscreen}
                onDataLoad={setFutureData}
              />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}