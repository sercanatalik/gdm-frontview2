"use client"

import * as React from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart"
import { useFutureData } from "@/lib/query/future"
import { formatCurrency, sanitizeKey, generateChartConfig, CustomTooltip } from "./cashout-chart-utils"

interface FutureChartProps {
  fieldName: string
  groupBy: string
  filters: any
  asOfDate: string | null
  isFullscreen: boolean
  onDataLoad?: (data: any) => void
}

export const processFutureData = (data: Record<string, unknown>[]) => {
  const groupedData: Record<string, Record<string, number>> = {}
  const globalGroupTotals: Record<string, number> = {}
  
  // First pass: collect all data and calculate global totals
  data.forEach(item => {
    const asOfDate = item.asOfDate as string
    const dateStr = asOfDate.split(' ')[0]
    const groupByField = Object.keys(item).find(key => 
      key !== 'asOfDate' && key !== 'value' && key !== 'monthly_value' && key !== 'groupBy'
    )
    const groupValue = groupByField ? String(item[groupByField] || 'Unknown') : 
                       item.groupBy !== null ? String(item.groupBy) : 'Total'
    const value = Number(item.monthly_value || 0)
    
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

export const FutureChart = React.forwardRef<HTMLDivElement, FutureChartProps>(
  ({ fieldName, groupBy, filters, asOfDate, isFullscreen, onDataLoad }, ref) => {
    
    const { data, isLoading, error } = useFutureData({
      table: "f_exposure",
      fieldName,
      groupBy: groupBy === "none" ? undefined : groupBy,
      asOfDate,
      filters
    })

    React.useEffect(() => {
      if (data?.data && onDataLoad) {
        onDataLoad(data.data)
      }
    }, [data, onDataLoad])

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[400px]">
          <div className="h-8 w-8 animate-spin text-primary">Loading...</div>
        </div>
      )
    }

    if (error || !data?.data || data.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <span>{error ? "Error loading chart data" : "No data available for the selected period"}</span>
        </div>
      )
    }

    const chartData = processFutureData(data.data)
    const isStacked = Boolean(data.meta.groupBy)
    const chartConfig = generateChartConfig(chartData, isStacked)
    const sanitizedGroups = Object.keys(chartConfig)

    return (
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
    )
  }
)

FutureChart.displayName = 'FutureChart'