"use client"

import * as React from "react"
import { useStore } from "@tanstack/react-store"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart"
import { useHistoricalData } from "@/lib/query/historical"
import { filtersStore } from "@/lib/store/filters"
import { Loader2, AlertCircle, BarChart3 } from "lucide-react"

interface HistoricalCashoutChartProps {
  className?: string
}

// Generate a consistent color palette for vcProduct
const generateChartConfig = (data: any[], isStacked: boolean = false): ChartConfig => {
  const multiColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
 
  ]
  
  // Generate monochrome colors for stacked bars (from primary to lighter)
  const generateMonochromeColors = (count: number): string[] => {
    const colors: string[] = []
    for (let i = 0; i < count; i++) {
      const lightness = 25 + (i * 15) // Start at 25% (primary) and increase by 15% each step
      const saturation = 80 - (i * 5) // Start high saturation and decrease slightly
      colors.push(`hsl(1100, ${Math.max(saturation, 40)}%, ${Math.min(lightness, 85)}%)`)
    }
    return colors
  }
  
  const uniqueProducts = [...new Set(data.map(item => item.vcProduct))]
  const config: ChartConfig = {}
  
  const colors = isStacked 
    ? generateMonochromeColors(uniqueProducts.length)
    : multiColors
  
  uniqueProducts.forEach((product, index) => {
    config[product] = {
      label: product,
      color: colors[index % colors.length],
    }
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
  // Group by date and sum by vcProduct
  const groupedData: Record<string, Record<string, number>> = {}
  
  data.forEach(item => {
    const date = item.asOfDate
    const product = item.vcProduct || 'Unknown'
    const value = item.value || 0
    
    if (!groupedData[date]) {
      groupedData[date] = {}
    }
    
    groupedData[date][product] = (groupedData[date][product] || 0) + value
  })
  
  // Convert to array format for recharts
  return Object.entries(groupedData)
    .map(([date, products]) => ({
      date: new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: date,
      ...products
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    .slice(-30) // Show last 30 data points
}

export function HistoricalCashoutChart({ 
  className
}: HistoricalCashoutChartProps) {
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)
  
  const { data, isLoading, error } = useHistoricalData({
    table: "risk_f_mv",
    fieldName: "cashOut",
    groupBy: "vcProduct",
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
  const chartConfig = generateChartConfig(data.data, isStacked)
  const uniqueProducts = Object.keys(chartConfig)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5" />
          Historical Cashout {data?.meta.groupBy ? `by ${data.meta.groupBy}` : ''}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {data?.meta.groupBy && (
            <span className="ml-2 text-xs bg-orange-100 text-blue-800 px-2 py-1 rounded">
              Stacked by {data.meta.groupBy}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
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
            {uniqueProducts.map((product) => (
              <Bar
                key={product}
                dataKey={product}
                stackId={data?.meta.groupBy ? "stacked" : undefined}
                fill={`var(--color-${product})`}
                radius={data?.meta.groupBy ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}