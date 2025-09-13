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

export const processHistoricalData = (data: Record<string, unknown>[]) => {
  if (!data || data.length === 0) {
    return []
  }

  // Check if data is already grouped (has groupBy field) or needs grouping
  const hasGroupByField = data.some(item => 'groupBy' in item)
  
  if (hasGroupByField) {
    // Data comes with groupBy field, transform it directly
    const groupedByDate: Record<string, Record<string, number>> = {}
    
    data.forEach(item => {
      const asOfDate = item.asOfDate as string
      if (!asOfDate) return
      
      const dateStr = asOfDate.split(' ')[0]
      const groupValue = item.groupBy ? String(item.groupBy) : 'Total'
      const value = Number(item.value || 0)
      
      // Skip if value is not valid
      if (isNaN(value)) return
      
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {}
      }
      
      const sanitizedGroupValue = sanitizeKey(groupValue)
      groupedByDate[dateStr][sanitizedGroupValue] = value
    })
    
    // Convert to chart format with guaranteed numeric values
    const result = Object.entries(groupedByDate)
      .map(([date, groups]) => {
        const point: any = {
          date: new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric'
          }),
          fullDate: date
        }
        
        // Ensure all values are proper numbers
        Object.entries(groups).forEach(([key, value]) => {
          point[key] = typeof value === 'number' && !isNaN(value) ? value : 0
        })
        
        return point
      })
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      
    return result
  }

  // Original processing for ungrouped data
  const groupedData: Record<string, Record<string, number>> = {}
  const globalGroupTotals: Record<string, number> = {}
  
  // First pass: collect all data and calculate global totals
  data.forEach(item => {
    const asOfDate = item.asOfDate as string
    if (!asOfDate) return
    
    const dateStr = asOfDate.split(' ')[0]
    
    // Find any other field that's not asOfDate or value
    const groupByField = Object.keys(item).find(key => 
      key !== 'asOfDate' && key !== 'value' && key !== 'groupBy'
    )
    const groupValue = groupByField ? String(item[groupByField] || 'Unknown') : 'Total'
    const value = Number(item.value || 0)
    
    if (!groupedData[dateStr]) {
      groupedData[dateStr] = {}
    }
    
    const sanitizedGroupValue = sanitizeKey(groupValue)
    groupedData[dateStr][sanitizedGroupValue] = (groupedData[dateStr][sanitizedGroupValue] || 0) + value
    
    // Track global totals for determining top 4
    globalGroupTotals[sanitizedGroupValue] = (globalGroupTotals[sanitizedGroupValue] || 0) + value
  })
  
  // If no data was grouped, return empty array
  if (Object.keys(groupedData).length === 0) {
    return []
  }
  
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

export const HistoricalChart = React.forwardRef<HTMLDivElement, HistoricalChartProps>(
  ({ fieldName, groupBy, filters, asOfDate, isFullscreen, onDataLoad }, ref) => {
    
    const { data, isLoading, error } = useHistoricalData({
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

    const chartData = processHistoricalData(data.data)
    
    // If no chart data after processing, show no data message
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <span>No data available for the selected period</span>
        </div>
      )
    }
    
    console.log('Processed chart data:', chartData)
    
    const isStacked = Boolean(data.meta.groupBy)
    const chartConfig = generateChartConfig(chartData, isStacked)
    
    // Get the actual data keys from the first data point (excluding date fields)
    const dataKeys = chartData.length > 0 
      ? Object.keys(chartData[0]).filter(key => key !== 'date' && key !== 'fullDate')
      : []
    
    console.log('Data keys:', dataKeys)
    console.log('Chart config:', chartConfig)
    
    // Use dataKeys as sanitizedGroups to ensure we only render bars for existing data
    const sanitizedGroups = dataKeys.filter(key => chartConfig[key])

    console.log('Sanitized groups:', sanitizedGroups)

    // If no groups to display, show message
    if (sanitizedGroups.length === 0) {
      console.error('No valid data groups found. ChartData:', chartData, 'Config:', chartConfig)
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
    
    console.log('Safe chart data:', safeChartData)
    
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
            console.log(`Rendering bar for group: ${sanitizedGroup}`)
            console.log('Sample data values for this group:', safeChartData.map(d => d[sanitizedGroup]))
            
            // Validate that this group actually has data
            const groupValues = safeChartData.map(d => d[sanitizedGroup]).filter(v => v !== undefined && v !== null && !isNaN(v))
            if (groupValues.length === 0) {
              console.warn(`Skipping group ${sanitizedGroup} - no valid values`)
              return null
            }
            
            return (
              <Bar 
                key={sanitizedGroup} 
                dataKey={sanitizedGroup}
                fill={`var(--color-${sanitizedGroup})`}
              />
            )
          })}
        </BarChart>
      </ChartContainer>
      
    )
  }
)

HistoricalChart.displayName = 'HistoricalChart'