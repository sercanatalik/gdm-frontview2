"use client"

import * as React from "react"
import { useCallback } from "react"
import { useStore } from "@tanstack/react-store"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Loader2, AlertCircle, BarChart3, Maximize2, X, Settings, Download, Image } from "lucide-react"

interface HistoricalCashoutChartProps {
  className?: string
}

// Generate a consistent color palette for any groupBy field
const generateChartConfig = (data: any[], isStacked: boolean = false): ChartConfig => {
  const multiColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))",
    "hsl(var(--chart-9))",
    "hsl(var(--chart-10))",
    "hsl(var(--chart-11))", 
 
  ]
  
  // Extract unique group values from processed chart data
  // The processed data has keys like 'date', 'fullDate', and then the actual group values
  const uniqueGroups = [...new Set(
    data.flatMap(item => 
      Object.keys(item).filter(key => key !== 'date' && key !== 'fullDate')
    )
  )].filter(Boolean)
  
  // Generate monochrome colors for stacked bars using predefined color palette
  const generateMonochromeColors = (count: number): string[] => {
    const predefinedColors = [
      '#101720', // darkest midnight blue
      '#2c333e',
      '#4a535e', 
      '#5a636e',
      '#6b747f',
      '#7c8591',
      '#8e97a3',
      '#a0a9b6',
      '#b2bcc8'  // lightest
    ]
    
    const colors: string[] = []
    for (let i = 0; i < count; i++) {
      // Use predefined colors, cycling through from darkest to lightest
      const colorIndex = Math.floor(i * (predefinedColors.length - 1) / Math.max(count - 1, 1))
      colors.push(predefinedColors[colorIndex])
    }
    return colors
  }
  
  const config: ChartConfig = {}
  
  const colors = isStacked 
    ? generateMonochromeColors(uniqueGroups.length)
    : multiColors
  
  // Create a mapping of original to sanitized group names
  const groupMapping: Record<string, string> = {}
  
  uniqueGroups.forEach((group, index) => {
    // Sanitize group name for CSS variable (replace spaces, special chars with underscores)
    const sanitizedKey = String(group).replace(/[^a-zA-Z0-9]/g, '_')
    groupMapping[sanitizedKey] = group
    config[sanitizedKey] = {
      label: group,
      color: colors[index % colors.length],
    }
  })
  
  // Debug logging for color generation
  console.log('Color Debug:', {
    uniqueGroups,
    isStacked,
    colorsGenerated: colors,
    finalConfig: config
  })
  
  return config
}

// Format currency for display
const formatCurrency = (value: number): string => {
  const millions = value / 1000000
  return `$${millions.toFixed(1)}M`
}

// Process data for the chart
const processChartData = (data: any[]) => {
  // Group by date and sum by groupBy field
  const groupedData: Record<string, Record<string, number>> = {}
  
  data.forEach(item => {
    // Handle datetime format from API (e.g., "2025-04-30 00:00:00")
    const dateStr = item.asOfDate.split(' ')[0] // Get just the date part
    
    // Find the groupBy field value (could be desk, vcProduct, etc.)
    const groupByField = Object.keys(item).find(key => 
      key !== 'asOfDate' && key !== 'value'
    )
    const groupValue = groupByField ? (item[groupByField] || 'Unknown') : 'Total'
    const value = item.value || 0
    
    if (!groupedData[dateStr]) {
      groupedData[dateStr] = {}
    }
    
    // Sanitize group name for consistent processing
    const sanitizedGroupValue = String(groupValue).replace(/[^a-zA-Z0-9]/g, '_')
    groupedData[dateStr][sanitizedGroupValue] = (groupedData[dateStr][sanitizedGroupValue] || 0) + value
  })
  
  // Convert to array format for recharts
  return Object.entries(groupedData)
    .map(([date, groups]) => ({
      date: new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: date,
      ...groups
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    .slice(-30) // Show last 30 data points
}

export function HistoricalCashoutChart({ 
  className
}: HistoricalCashoutChartProps) {
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)
  
  // Chart configuration state
  const [fieldName, setFieldName] = React.useState("cashOut")
  const [groupBy, setGroupBy] = React.useState("vcProduct")
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("historical")
  
  // PNG export functionality using html2canvas-pro
  const historicalChartRef = React.useRef<HTMLDivElement>(null)
  const futureChartRef = React.useRef<HTMLDivElement>(null)
  const [exportLoading, setExportLoading] = React.useState(false)
  
  // Get current chart ref based on active tab
  const chartRef = activeTab === "historical" ? historicalChartRef : futureChartRef
  
  // Field options for the chart
  const fieldOptions = [
    { value: "cashOut", label: "Cash Out" },
    { value: "notional", label: "Notional Amount" },
  ]
  
  // GroupBy options from filter config
  const groupByOptions = [
    { value: "none", label: "None" },
    ...Object.entries(riskFilterConfig.filterTypes).map(([key, value]) => ({
      value: value,
      label: key
    }))
  ]
  
  // Download CSV function
  const handleDownload = () => {
    if (!data?.data) return
    
    const csvData = data.data.map(row => ({
      ...row
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-${fieldName}-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  // Save as PNG function using html2canvas-pro
  const handleSaveAsPng = useCallback(async () => {
    if (!chartRef.current) return
    
    setExportLoading(true)
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // High quality
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
  }, [fieldName, activeTab])
  
  const { data: historicalData, isLoading: historicalLoading, error: historicalError } = useHistoricalData({
    table: "risk_f_mv",
    fieldName,
    groupBy: groupBy === "none" ? undefined : groupBy,
    asOfDate,
    filters
  })

  const { data: futureData, isLoading: futureLoading, error: futureError } = useFutureData({
    table: "risk_f_mv",
    fieldName,
    groupBy: groupBy === "none" ? undefined : groupBy,
    asOfDate,
    filters
  })

  // Use appropriate data based on active tab
  const data = activeTab === "historical" ? historicalData : futureData
  const isLoading = activeTab === "historical" ? historicalLoading : futureLoading
  const error = activeTab === "historical" ? historicalError : futureError

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

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
        
        </CardHeader>
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

  const chartData = processChartData(data.data)
  const isStacked = Boolean(data.meta.groupBy)
  const chartConfig = generateChartConfig(chartData, isStacked)
  const sanitizedGroups = Object.keys(chartConfig)
  
  // // Debug logging
  // console.log('Chart Debug:', {
  //   isStacked,
  //   sanitizedGroups,
  //   chartConfig,
  //   groupByField: data.meta.groupBy
  // })

  // Toolbar component
  const ChartToolbar = () => (
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
                  {fieldOptions.map((option) => (
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
      <Button variant="ghost" size="sm" className="px-1" onClick={handleDownload} disabled={!data?.data}>
        <Download className="size-3" />
      </Button>
      <Button variant="ghost" size="sm" className="px-1" onClick={handleSaveAsPng} disabled={!data?.data || exportLoading}>
        <Image className="size-3" />
      </Button>
      {!isFullscreen && (
        <Button variant="ghost" size="sm" className="px-1" onClick={() => setIsFullscreen(true)}>
          <Maximize2 className="size-3" />
        </Button>
      )}
    </div>
  )

  const chartContent = (
    <div className={isFullscreen ? "fixed inset-0 bg-background z-50 flex flex-col" : ""}>
      {isFullscreen && (
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Historical {fieldOptions.find(f => f.value === fieldName)?.label}</h2>
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
                  <TabsTrigger value="historical">Historical {fieldOptions.find(f => f.value === fieldName)?.label}</TabsTrigger>
                  <TabsTrigger value="future">Future {fieldOptions.find(f => f.value === fieldName)?.label}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <ChartToolbar />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="historical" className="m-0">
            <CardContent className={isFullscreen ? "pt-4 pb-8 px-0" : "pt-4 px-0"}>
          <ChartContainer ref={historicalChartRef} config={chartConfig} className={isFullscreen ? "h-[calc(100vh-250px)]" : "h-auto min-h-[400px] aspect-[2/1]"}>
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
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
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
              }}
            />
            <ChartLegend content={<ChartLegendContent payload={[]} />} />
            {sanitizedGroups.map((sanitizedGroup) => (
              <Bar
                key={sanitizedGroup}
                dataKey={sanitizedGroup}
                stackId={data?.meta.groupBy ? "stacked" : undefined}
                fill={`var(--color-${sanitizedGroup})`}
                radius={data?.meta.groupBy ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
            </ChartContainer>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="future" className="m-0">
            <CardContent className={isFullscreen ? "pt-4 pb-8 px-0" : "pt-4 px-0"}>
              <ChartContainer ref={futureChartRef} config={chartConfig} className={isFullscreen ? "h-[calc(100vh-250px)]" : "h-auto min-h-[400px] aspect-[2/1]"}>
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
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
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
                    }}
                  />
                  <ChartLegend content={<ChartLegendContent payload={[]} />} />
                  {sanitizedGroups.map((sanitizedGroup) => (
                    <Bar
                      key={sanitizedGroup}
                      dataKey={sanitizedGroup}
                      stackId={data?.meta.groupBy ? "stacked" : undefined}
                      fill={`var(--color-${sanitizedGroup})`}
                      radius={data?.meta.groupBy ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )

  return chartContent
}