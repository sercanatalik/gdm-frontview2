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
  if (!data || data.length === 0) {
    return []
  }

  // Determine field name from the cumulative field (e.g., cumulative_cashOut -> cashOut)
  const cumulativeField = Object.keys(data[0] || {}).find(key => key.startsWith('cumulative_'))
  const fieldName = cumulativeField ? cumulativeField.replace('cumulative_', '') : null

  // Check if data has a groupBy column
  const groupByField = Object.keys(data[0] || {}).find(key =>
    key !== 'maturityDt' && key !== fieldName && key !== cumulativeField
  )
  
  if (groupByField) {
    // Group data by date and groupBy field, using cumulative values (remaining amounts)
    const groupedByDate: Record<string, Record<string, number>> = {}
    const totalsByGroup: Record<string, number> = {}

    // First pass: find the maximum cumulative value (initial total) for each group
    data.forEach(item => {
      const groupValue = String(item[groupByField] || 'Unknown')
      const cumulativeValue = Number(item[cumulativeField!] || 0)
      const sanitizedGroupValue = sanitizeKey(groupValue)

      // The maximum cumulative value is the initial total for each group
      if (!totalsByGroup[sanitizedGroupValue] || cumulativeValue > totalsByGroup[sanitizedGroupValue]) {
        totalsByGroup[sanitizedGroupValue] = cumulativeValue
      }
    })

    // Second pass: collect the remaining values for each month/group
    // We need to track the latest value for each group at each month
    const latestValuesByGroupAndMonth: Record<string, Record<string, number>> = {}

    data.forEach(item => {
      const maturityDt = item.maturityDt as string
      if (!maturityDt) return

      const dateStr = new Date(maturityDt).toISOString().slice(0, 7) // YYYY-MM format
      const groupValue = String(item[groupByField] || 'Unknown')
      const cumulativeValue = Number(item[cumulativeField!] || 0) // This is the remaining amount

      // Skip if value is not valid
      if (isNaN(cumulativeValue)) return

      const sanitizedGroupValue = sanitizeKey(groupValue)

      if (!latestValuesByGroupAndMonth[sanitizedGroupValue]) {
        latestValuesByGroupAndMonth[sanitizedGroupValue] = {}
      }

      // Store the latest (smallest) value for this group at this month
      // Since data is ordered by date, the last value for each month is the end-of-month value
      latestValuesByGroupAndMonth[sanitizedGroupValue][dateStr] = cumulativeValue
    })

    // Get all unique months from all groups
    const allMonths = new Set<string>()
    Object.values(latestValuesByGroupAndMonth).forEach(monthData => {
      Object.keys(monthData).forEach(month => allMonths.add(month))
    })

    // Build the grouped data structure with all groups present at each month
    Array.from(allMonths).forEach(dateStr => {
      groupedByDate[dateStr] = {}

      Object.entries(latestValuesByGroupAndMonth).forEach(([group, monthData]) => {
        // Use the value for this month if it exists, otherwise find the latest previous value
        let value = monthData[dateStr]

        if (value === undefined) {
          // Find the latest value before this month
          const sortedMonths = Object.keys(monthData).sort()
          const previousMonths = sortedMonths.filter(m => m <= dateStr)
          if (previousMonths.length > 0) {
            value = monthData[previousMonths[previousMonths.length - 1]]
          } else {
            // If no previous value, use the total (initial value)
            value = totalsByGroup[group] || 0
          }
        }

        groupedByDate[dateStr][group] = value || 0
      })
    })

    // Determine the top 4 groups by total value
    const globalTop4 = Object.entries(totalsByGroup)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([key]) => key)
    
    // Process each date keeping only the top 4 groups and aggregate others
    const processedData = Object.entries(groupedByDate)
      .map(([dateStr, groups]) => {
        const point: any = {
          date: new Date(dateStr + '-01').toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
          }),
          fullDate: dateStr + '-01'
        }

        let othersTotal = 0

        // Process each group for this date
        Object.entries(groups).forEach(([key, value]) => {
          if (globalTop4.includes(key)) {
            point[key] = value
          } else {
            othersTotal += value
          }
        })

        // Add "Others" if there are any
        if (othersTotal > 0) {
          point[sanitizeKey('Others')] = othersTotal
        }

        return point
      })
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())

    return processedData
  }

  // Process ungrouped data (single series)
  const processedByMonth: Record<string, number> = {}

  data.forEach(item => {
    const maturityDt = item.maturityDt as string
    if (!maturityDt) return

    const dateStr = new Date(maturityDt).toISOString().slice(0, 7) // YYYY-MM format
    const cumulativeValue = Number(item[cumulativeField!] || 0)

    // Store the latest cumulative value for each month
    processedByMonth[dateStr] = cumulativeValue
  })
  
  // If no data was processed, return empty array
  if (Object.keys(processedByMonth).length === 0) {
    return []
  }

  // Convert to array format for charting
  const processedData = Object.entries(processedByMonth).map(([dateStr, value]) => {
    return {
      date: new Date(dateStr + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      }),
      fullDate: dateStr + '-01',
      Total: value
    }
  })
  .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())

  return processedData
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
    
    // If no chart data after processing, show no data message
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <span>No data available for the selected period</span>
        </div>
      )
    }
    
    // console.log('Processed chart data:', chartData)
    
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

FutureChart.displayName = 'FutureChart'