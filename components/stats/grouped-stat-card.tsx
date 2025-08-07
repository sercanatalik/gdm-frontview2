"use client"

import React, { useMemo, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useGroupedStatsData, type GroupedStatMeasure, formatters } from "@/lib/query/stats"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, Expand, Download } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import html2canvas from 'html2canvas-pro'

interface GroupedStatCardProps {
  measure: GroupedStatMeasure
  groupBy: string
  relativeDt: string
  asOfDate?: string | null
  className?: string
  filters?: any[]
}

interface GroupedStatData {
  groupValue: string
  current: number
  previous: number
  change: number
  changePercent: number
  counterpartyCount: number
  notionalAmount: number
  percentage: number
}

const CHART_COLORS = [
 
  '#374151', // gray-700
  '#4b5563', // gray-600
  '#6b7280', // gray-500
  '#9ca3af', // gray-400
  '#d1d5db', // gray-300
  '#e5e7eb', // gray-200
  '#f3f4f6', // gray-100
]

function GroupedStatCard({ measure, groupBy, relativeDt, asOfDate, className, filters }: GroupedStatCardProps) {
  const { data, isLoading, error } = useGroupedStatsData(measure, groupBy, relativeDt, asOfDate, filters)
  const modalContentRef = useRef<HTMLDivElement>(null)

  const downloadAsPNG = async () => {
    if (!modalContentRef.current) return
    
    try {
      const canvas = await html2canvas(modalContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })
      
      const link = document.createElement('a')
      link.download = `${groupBy}-stats-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error downloading chart:', error)
    }
  }

  // Unified number formatting function
  const formatValue = (value: number, type: 'currency' | 'count' | 'percentage' = 'count') => {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    
    if (type === 'percentage') return `(${value.toFixed(1)}%)`
    
    const format = (num: number, suffix: string) => 
      type === 'currency' ? `${sign}$${num.toFixed(1)}${suffix}` : `${sign}${num.toFixed(1)}${suffix}`
    
    if (absValue >= 1000000) return format(absValue / 1000000, 'M')
    if (absValue >= 1000) return format(absValue / 1000, 'K')
    
    return type === 'currency' ? `${sign}$${Math.round(absValue)}` : Math.round(value).toString()
  }

  // Generate chart data with top 4 + Others aggregation
  const chartData = useMemo(() => {
    if (!data?.length) return []
    
    const createChartItem = (item: GroupedStatData, index: number) => ({
      name: item.groupValue,
      value: Math.abs(item.current),
      color: item.groupValue === 'Others' ? '#9ca3af' : CHART_COLORS[index % CHART_COLORS.length]
    })
    
    if (data.length <= 5) return data.map(createChartItem)
    
    const [topItems, otherItems] = [data.slice(0, 4), data.slice(4)]
    const chartItems = topItems.map(createChartItem)
    
    if (otherItems.length > 0) {
      chartItems.push({
        name: 'Others',
        value: Math.abs(otherItems.reduce((sum, item) => sum + item.current, 0)),
        color: '#9ca3af'
      })
    }
    
    return chartItems
  }, [data])

  return (
    <Dialog>
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">By {groupBy}</CardTitle>
            <DialogTrigger asChild>
              <Expand className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
            </DialogTrigger>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2">
            <AlertCircle className="size-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">Error loading data</span>
          </div>
        ) : data && data.length > 0 ? (
          <>
            {/* Donut Chart */}
            <div className="h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={1}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                    label={({ name, value }) => {
                      if (!value) return ''
                      const totalValue = chartData.reduce((sum, item) => sum + item.value, 0)
                      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0
                      return `${name}: ${formatValue(percentage, 'percentage')}`
                    }}
                    labelLine={false}
                    style={{ fontSize: '10px', fontWeight: '500' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Data List */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              <div className="space-y-1.5 pr-1">
                {data.map((item, index) => {
                  const isOthers = item.groupValue === 'Others'
                  const currencyType = measure.formatter === formatters.currency ? 'currency' : 'count'
                  
                  return (
                    <div 
                      key={item.groupValue} 
                      className={`flex items-center justify-between py-1.5 border-b border-border/50 last:border-b-0 ${
                        isOthers ? 'bg-muted/30 rounded-sm px-1' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isOthers ? 'border border-muted-foreground/50' : ''
                          }`}
                          style={{ 
                            backgroundColor: isOthers ? '#9ca3af' : CHART_COLORS[index % CHART_COLORS.length]
                          }}
                        />
                        <div>
                          <div className={`font-medium text-xs ${
                            isOthers ? 'text-muted-foreground italic' : ''
                          }`}>
                            {item.groupValue}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatValue(item.counterpartyCount, 'count')} counterparty
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium text-xs ${
                          isOthers ? 'text-muted-foreground' : ''
                        }`}>
                          {formatValue(item.current, currencyType)} {formatValue(item.percentage, 'percentage')}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatValue(item.notionalAmount, currencyType)} notional
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
    
    <DialogContent className="max-w-[98vw] w-[98vw] h-[90vh] max-h-[90vh] overflow-y-auto sm:max-w-[60vw]">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle>By {groupBy} - Expanded View</DialogTitle>
          <button
            onClick={downloadAsPNG}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Download PNG</span>
          </button>
        </div>
      </DialogHeader>
      
      <div ref={modalContentRef}>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center space-x-2">
          <AlertCircle className="size-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive">Error loading data</span>
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Larger Chart */}
          <div className="h-96 lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={1}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={({ name, value }) => {
                    if (!value) return ''
                    const totalValue = chartData.reduce((sum, item) => sum + item.value, 0)
                    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0
                    return `${name}: ${formatValue(percentage, 'percentage')}`
                  }}
                  labelLine={false}
                  style={{ fontSize: '12px', fontWeight: '500' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Detailed Data List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-4">Detailed Breakdown</h3>
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {data.map((item, index) => {
                const isOthers = item.groupValue === 'Others'
                const currencyType = measure.formatter === formatters.currency ? 'currency' : 'count'
                
                return (
                  <div 
                    key={item.groupValue} 
                    className={`flex items-center justify-between p-3 border border-border rounded-md ${
                      isOthers ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          isOthers ? 'border border-muted-foreground/50' : ''
                        }`}
                        style={{ 
                          backgroundColor: isOthers ? '#9ca3af' : CHART_COLORS[index % CHART_COLORS.length]
                        }}
                      />
                      <div>
                        <div className={`font-medium text-sm ${
                          isOthers ? 'text-muted-foreground italic' : ''
                        }`}>
                          {item.groupValue}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatValue(item.counterpartyCount, 'count')} counterparties
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium text-sm ${
                        isOthers ? 'text-muted-foreground' : ''
                      }`}>
                        {formatValue(item.current, currencyType)} {formatValue(item.percentage, 'percentage')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatValue(item.notionalAmount, currencyType)} notional
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No data available</div>
      )}
      </div>
    </DialogContent>
  </Dialog>
  )
}

export { GroupedStatCard }
export type { GroupedStatCardProps, GroupedStatData }