"use client"

import * as React from "react"
import { useCallback } from "react"
import { useStore } from "@tanstack/react-store"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import html2canvas from 'html2canvas-pro'
import * as FileSaver from "file-saver"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart"
import { useHistoricalData } from "@/lib/query/historical"
import { useFutureData } from "@/lib/query/future"
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
import { Loader2, AlertCircle, BarChart3, Expand, X, Settings, Download, Image } from "lucide-react"

interface CashoutChartProps {
  className?: string
}

// Color palettes
const MULTI_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-8))",
  "hsl(var(--chart-10))",
]

const MONOCHROME_COLORS = [
  '#0a0e15',  // Very dark (almost black)
  '#2a3441',  // Dark gray-blue
  '#525c6a',  // Medium gray
  '#7f8b9b',  // Light gray-blue
  '#b8c1ce',  // Very light gray
]

// Field and GroupBy options
const FIELD_OPTIONS = [
  { value: "fundingAmount", label: "Cash Out" },
  { value: "collateralAmount", label: "Notional Amount" },
]

// Utilities
const formatCurrency = (value: number): string => {
  const millions = value / 1000000
  return `$${millions.toFixed(1)}M`
}

const sanitizeKey = (key: string): string => {
  return String(key).replace(/[^a-zA-Z0-9]/g, '_')
}

const generateChartConfig = (data: Record<string, unknown>[], isStacked: boolean = false): ChartConfig => {
  const uniqueGroups = [...new Set(
    data.flatMap(item => 
      Object.keys(item).filter(key => key !== 'date' && key !== 'fullDate')
    )
  )].filter(Boolean)
  
  // Sort groups to ensure "Others" is always last
  uniqueGroups.sort((a, b) => {
    if (a === 'Others') return 1
    if (b === 'Others') return -1
    return 0
  })
  
  const config: ChartConfig = {}
  
  if (isStacked) {
    // For stacked charts, use monochrome colors with high contrast
    uniqueGroups.forEach((group, index) => {
      const sanitizedKey = sanitizeKey(group)
      let color: string
      
      if (sanitizedKey === 'Others') {
        // Use the lightest color for "Others"
        color = MONOCHROME_COLORS[MONOCHROME_COLORS.length - 1]
      } else {
        // Distribute other colors evenly across the darker spectrum
        color = MONOCHROME_COLORS[Math.min(index, MONOCHROME_COLORS.length - 2)]
      }
      
      config[sanitizedKey] = {
        label: group === 'Others' ? 'Others' : group,
        color,
      }
    })
  } else {
    // For non-stacked charts, use multi-colors
    uniqueGroups.forEach((group, index) => {
      const sanitizedKey = sanitizeKey(group)
      const color = sanitizedKey === 'Others' 
        ? 'hsl(var(--muted-foreground))' 
        : MULTI_COLORS[index % MULTI_COLORS.length]
      
      config[sanitizedKey] = {
        label: group === 'Others' ? 'Others' : group,
        color,
      }
    })
  }
  
  return config
}

const processChartData = (data: Record<string, unknown>[], dataType: 'historical' | 'future' = 'historical') => {
  const groupedData: Record<string, Record<string, number>> = {}
  const globalGroupTotals: Record<string, number> = {}
  
  // First pass: collect all data and calculate global totals
  data.forEach(item => {
    const asOfDate = item.asOfDate as string
    const dateStr = asOfDate.split(' ')[0]
    const groupByField = Object.keys(item).find(key => 
      key !== 'asOfDate' && key !== 'value' && key !== 'monthly_value'
    )
    const groupValue = groupByField ? String(item[groupByField] || 'Unknown') : 'Total'
    const value = dataType === 'future' 
      ? Number(item.monthly_value || 0) 
      : Number(item.value || 0)
    
    if (!groupedData[dateStr]) {
      groupedData[dateStr] = {}
    }
    
    const sanitizedGroupValue = sanitizeKey(groupValue)
    groupedData[dateStr][sanitizedGroupValue] = (groupedData[dateStr][sanitizedGroupValue] || 0) + value
    
    // Track global totals for determining top 4
    globalGroupTotals[sanitizedGroupValue] = (globalGroupTotals[sanitizedGroupValue] || 0) + value
  })
  
  // Determine the top 4 groups globally
  const globalTop4 = Object.entries(globalGroupTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key]) => key)
  
  // Second pass: process each date keeping only the global top 4 and aggregate others
  const processedData = Object.entries(groupedData).map(([date, groups]) => {
    const result: Record<string, number> = {}
    let othersTotal = 0
    
    Object.entries(groups).forEach(([key, value]) => {
      if (globalTop4.includes(key)) {
        result[key] = value
      } else {
        othersTotal += value
      }
    })
    
    // Add "Others" if there are any
    if (othersTotal > 0) {
      result[sanitizeKey('Others')] = othersTotal
    }
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric'
      }),
      fullDate: date,
      ...result
    }
  })
  
  return processedData.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ payload: { fullDate: string }, color: string, name: string, value: number }>
  label?: string
}) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const fullDate = payload[0]?.payload?.fullDate
  const dateLabel = fullDate 
    ? new Date(fullDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : label

  return (
    <div className="bg-background border border-border/50 rounded-lg p-3 shadow-xl">
      <p className="font-medium mb-2">{dateLabel}</p>
      <div className="space-y-1">
        <table className="w-full">
          <tbody>
            {payload.map((item, index) => (
              <tr key={index} className="text-sm">
                <td className="pr-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                </td>
                <td className="pr-4 text-muted-foreground">
                  {item.name}
                </td>
                <td className="text-right font-mono font-medium">
                  {formatCurrency(item.value as number)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Chart Component
const ChartComponent = React.forwardRef<HTMLDivElement, {
  chartData: Record<string, unknown>[]
  chartConfig: ChartConfig
  isStacked: boolean
  sanitizedGroups: string[]
  isFullscreen: boolean
}>(({ chartData, chartConfig, isStacked, sanitizedGroups, isFullscreen }, ref) => (
  <ChartContainer 
    ref={ref} 
    config={chartConfig} 
    className={isFullscreen ? "h-[calc(100vh-250px)]" : "h-[400px] w-full"}
  >
    <BarChart
      data={chartData}
      margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
    >
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={32}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        tickFormatter={formatCurrency}
      />
      <ChartTooltip cursor={false} content={<CustomTooltip />} />
      <ChartLegend content={<ChartLegendContent payload={[]} />} />
      {sanitizedGroups.map((sanitizedGroup) => (
        <Bar
          key={sanitizedGroup}
          dataKey={sanitizedGroup}
          stackId={isStacked ? "stacked" : undefined}
          fill={`var(--color-${sanitizedGroup})`}
          radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
        />
      ))}
    </BarChart>
  </ChartContainer>
))

ChartComponent.displayName = 'ChartComponent'

export function CashoutChart({ className }: CashoutChartProps) {
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)
  
  // State
  const [fieldName, setFieldName] = React.useState("fundingAmount")
  const [groupBy, setGroupBy] = React.useState("null")
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("historical")
  const [exportLoading, setExportLoading] = React.useState(false)
  
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
  
  // Data fetching
  const { data: historicalData, isLoading: historicalLoading, error: historicalError } = useHistoricalData({
    table: "f_exposure",
    fieldName,
    groupBy: groupBy === "none" ? undefined : groupBy,
    asOfDate,
    filters
  })

  const { data: futureData, isLoading: futureLoading, error: futureError } = useFutureData({
    table: "f_exposure",
    fieldName,
    groupBy: groupBy === "none" ? undefined : groupBy,
    asOfDate,
    filters
  })

  const data = activeTab === "historical" ? historicalData : futureData
  const isLoading = activeTab === "historical" ? historicalLoading : futureLoading
  const error = activeTab === "historical" ? historicalError : futureError

  // Export functions
  const handleDownload = useCallback(() => {
    if (!data?.data) return
    
    const csvContent = [
      Object.keys(data.data[0]).join(','),
      ...data.data.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-${fieldName}-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data, activeTab, fieldName])
  
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

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5" />
              <span>Error loading chart data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!data?.data || data.data.length === 0) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <span>No data available for the selected period</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = processChartData(data.data, activeTab as 'historical' | 'future')
  const isStacked = Boolean(data.meta.groupBy)
  const chartConfig = generateChartConfig(chartData, isStacked)
  const sanitizedGroups = Object.keys(chartConfig)

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
                disabled={!data?.data}
              >
                <Download className="size-3" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-1" 
                onClick={handleSaveAsPng} 
                disabled={!data?.data || exportLoading}
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
              <ChartComponent
                ref={historicalChartRef}
                chartData={chartData}
                chartConfig={chartConfig}
                isStacked={isStacked}
                sanitizedGroups={sanitizedGroups}
                isFullscreen={isFullscreen}
              />
            </CardContent>
          </TabsContent>
          
          <TabsContent value="future" className="m-0">
            <CardContent className={isFullscreen ? "pt-4 pb-8 px-0" : "pt-4 px-0"}>
              <ChartComponent
                ref={futureChartRef}
                chartData={chartData}
                chartConfig={chartConfig}
                isStacked={isStacked}
                sanitizedGroups={sanitizedGroups}
                isFullscreen={isFullscreen}
              />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}