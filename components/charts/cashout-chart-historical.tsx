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
import { useHistoricalData } from "@/lib/query/historical"
import { formatCurrency, sanitizeKey, generateChartConfig, CustomTooltip } from "./cashout-chart-utils"

interface HistoricalChartProps {
  fieldName: string
  groupBy: string
  filters: any
  asOfDate: string | null
  isFullscreen: boolean
  onDataLoad?: (data: any) => void
}

export const processHistoricalData = (data: Record<string, unknown>[], fieldName?: string) => {
  if (!data || data.length === 0) {
    return []
  }

  // Check if data has a groupBy field (indicates grouped data)
  const firstItem = data[0]
  const hasGroupBy = Object.keys(firstItem).some(key =>
    key !== 'asOfDate' && key !== fieldName && firstItem[key] !== undefined
  )

  if (hasGroupBy) {
    // Find the groupBy field name
    const groupByField = Object.keys(firstItem).find(key =>
      key !== 'asOfDate' && key !== fieldName
    )

    if (!groupByField) {
      // No groupBy field found, treat as ungrouped
      return data.map(item => ({
        date: new Date(item.asOfDate as string).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        }),
        fullDate: item.asOfDate as string,
        Total: Number(item[fieldName || 'value'] || 0)
      })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    }

    // First pass: collect data and calculate totals for each group
    const groupedByDate: Record<string, Record<string, number>> = {}
    const globalGroupTotals: Record<string, number> = {}

    data.forEach(item => {
      const asOfDate = item.asOfDate as string
      if (!asOfDate) return

      const dateStr = asOfDate.split(' ')[0]
      const groupValue = item[groupByField] ? String(item[groupByField]) : 'Unknown'
      const value = Number(item[fieldName || 'value'] || 0)

      // Skip if value is not valid
      if (isNaN(value)) return

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {}
      }

      const sanitizedGroupValue = sanitizeKey(groupValue)
      groupedByDate[dateStr][sanitizedGroupValue] = (groupedByDate[dateStr][sanitizedGroupValue] || 0) + value

      // Track global totals for determining top 4
      globalGroupTotals[sanitizedGroupValue] = (globalGroupTotals[sanitizedGroupValue] || 0) + value
    })

    // Determine the top 4 groups globally
    const globalTop4 = Object.entries(globalGroupTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([key]) => key)

    // Second pass: process each date keeping only the global top 4 and aggregate others
    const result = Object.entries(groupedByDate)
      .map(([date, groups]) => {
        const point: any = {
          date: new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
          }),
          fullDate: date
        }

        let othersTotal = 0

        // Process each group for this date
        Object.entries(groups).forEach(([key, value]) => {
          const numValue = typeof value === 'number' && !isNaN(value) ? value : 0

          if (globalTop4.includes(key)) {
            point[key] = numValue
          } else {
            othersTotal += numValue
          }
        })

        // Add "Others" if there are any
        if (othersTotal > 0) {
          point[sanitizeKey('Others')] = othersTotal
        }

        return point
      })
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())

    return result
  }

  // Process ungrouped data - simple time series
  return data.map(item => ({
    date: new Date(item.asOfDate as string).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    }),
    fullDate: item.asOfDate as string,
    Total: Number(item[fieldName || 'value'] || 0)
  })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
}

export const HistoricalChart = React.forwardRef<HTMLDivElement, HistoricalChartProps>(
  ({ fieldName, groupBy, filters, asOfDate, isFullscreen, onDataLoad }, ref) => {
    
    const { data, isLoading, error } = useHistoricalData({
      table: "risk_mv",
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

    // Ensure data matches current query parameters
    const currentGroupBy = groupBy === "none" ? undefined : groupBy
    const metaGroupBy = data.meta.groupBy || undefined
    if (metaGroupBy !== currentGroupBy) {
      return (
        <div className="flex justify-center items-center h-[400px]">
          <div className="h-8 w-8 animate-spin text-primary">Loading...</div>
        </div>
      )
    }

    const chartData = processHistoricalData(data.data, fieldName)
    
    // If no chart data after processing, show no data message
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <span>No data available for the selected period</span>
        </div>
      )
    }
    
    
    const isStacked = Boolean(data.meta.groupBy)
    const chartConfig = generateChartConfig(chartData, isStacked)

    // Get the actual data keys from the first data point (excluding date fields)
    const dataKeys = chartData.length > 0
      ? Object.keys(chartData[0]).filter(key => key !== 'date' && key !== 'fullDate')
      : []

    // Use dataKeys as sanitizedGroups to ensure we only render bars for existing data
    const sanitizedGroups = dataKeys.filter(key => chartConfig[key])

    
    // If no groups to display, show message
    if (sanitizedGroups.length === 0) {
       return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <span>No data groups found to display</span>
        </div>
      )
    }
    
    // Ensure all data points have numeric values for all groups
    const safeChartData = chartData.map(point => {
      const safePoint: any = { ...point }
      sanitizedGroups.forEach(group => {
        if (!(group in safePoint) || safePoint[group] === null || safePoint[group] === undefined) {
          safePoint[group] = 0
        } else {
          safePoint[group] = Number(safePoint[group]) || 0
        }
      })
      return safePoint
    })
    
    
    // If we still have issues, try a simple fallback
    if (safeChartData.length === 0 || sanitizedGroups.length === 0) {
      console.error('Empty chart data or no groups to display')
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <span>Unable to render chart - no valid data</span>
        </div>
      )
    }

    return (
      <ChartContainer
        ref={ref}
        config={chartConfig}
        className={isFullscreen ? "h-[calc(100vh-250px)]" : "h-[400px] w-full"}
      >
        <BarChart
          key={`${groupBy}-${fieldName}-${isStacked}`}
          data={safeChartData}
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
            domain={[0, 'dataMax']}
          />
          <ChartTooltip cursor={false} content={<CustomTooltip />} />
          <ChartLegend content={<ChartLegendContent payload={[]} />} />
          {sanitizedGroups.length > 0 && sanitizedGroups.map((sanitizedGroup) => {
            // Validate that this group actually has data and chart config exists
            if (!chartConfig[sanitizedGroup]) {
              return null
            }

            const groupValues = safeChartData.map(d => d[sanitizedGroup]).filter(v => v !== undefined && v !== null && !isNaN(v))
            if (groupValues.length === 0) {
              return null
            }

            // Use direct colors from config when stacked (monochrome colors)
            const barFill = isStacked && chartConfig[sanitizedGroup]
              ? chartConfig[sanitizedGroup].color
              : `var(--color-${sanitizedGroup})`

            return (
              <Bar
                key={sanitizedGroup}
                dataKey={sanitizedGroup}
                stackId={isStacked ? "stack" : undefined}
                fill={barFill}
              />
            )
          })}
        </BarChart>
      </ChartContainer>
      
    )
  }
)

HistoricalChart.displayName = 'HistoricalChart'