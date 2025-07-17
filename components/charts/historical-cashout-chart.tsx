"use client"

import * as React from "react"
import { useStore } from "@tanstack/react-store"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart"
import { useHistoricalData } from "@/lib/query/historical"
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
import { Loader2, AlertCircle, BarChart3, Maximize2, X, Settings, Download } from "lucide-react"

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
  
  // Generate monochrome colors for stacked bars (from primary to lighter)
  const generateMonochromeColors = (count: number): string[] => {
    const colors: string[] = []
    const baseHue = 220 // Blue base color
    const baseSaturation = 70
    const baseLightness = 45
    
    for (let i = 0; i < count; i++) {
      // Create a gradient from dark to light
      const lightnessStep = Math.min(40 / Math.max(count - 1, 1), 25) // Ensure good contrast
      const lightness = baseLightness + (i * lightnessStep)
      const saturation = Math.max(baseSaturation - (i * 5), 30) // Maintain some saturation
      
      colors.push(`hsl(${baseHue}, ${saturation}%, ${Math.min(lightness, 80)}%)`)
    }
    return colors
  }
  
  const config: ChartConfig = {}
  
  const colors = isStacked 
    ? generateMonochromeColors(uniqueGroups.length)
    : multiColors
  
  uniqueGroups.forEach((group, index) => {
    config[group] = {
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
    
    groupedData[dateStr][groupValue] = (groupedData[dateStr][groupValue] || 0) + value
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
  
  // Download function
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
    a.download = `historical-${fieldName}-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const { data, isLoading, error } = useHistoricalData({
    table: "risk_f_mv",
    fieldName,
    groupBy: groupBy === "none" ? undefined : groupBy,
    asOfDate,
    filters
  })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Historical Cashout by VC Product
          </CardTitle>
        </CardHeader>
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
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Historical Cashout by VC Product
          </CardTitle>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Historical Cashout by VC Product
          </CardTitle>
        </CardHeader>
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
  const uniqueGroups = Object.keys(chartConfig)
  
  // Debug logging
  console.log('Chart Debug:', {
    isStacked,
    uniqueGroups,
    chartConfig,
    groupByField: data.meta.groupBy
  })

  // Toolbar component
  const ChartToolbar = () => (
    <div className="flex items-center gap-1">
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="size-4" />
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
      <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!data?.data}>
        <Download className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)}>
        <Maximize2 className="size-4" />
      </Button>
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
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Historical Cashout by VC Product
            </CardTitle>
            <ChartToolbar />
          </div>
        </div>
        <CardContent className={isFullscreen ? "pt-4 pb-8 px-0" : "pt-4 px-0"}>
          <ChartContainer config={chartConfig} className={isFullscreen ? "h-[calc(100vh-250px)]" : "h-[500px]"}>
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
            {uniqueGroups.map((group) => (
              <Bar
                key={group}
                dataKey={group}
                stackId={data?.meta.groupBy ? "stacked" : undefined}
                fill={`var(--color-${group})`}
                radius={data?.meta.groupBy ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  </div>
  )

  return chartContent
}