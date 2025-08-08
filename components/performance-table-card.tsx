"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from '@tanstack/react-query'
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface PerformanceTableCardProps {
  className?: string
  asOfDate?: string
  filters?: any[]
}

interface RegionData {
  region: string
  returnRWA: number
  yearToDate: number
  aopVsPlan: number
  pnl: number
}

interface DeskPerformanceData {
  desk: string
  returnRWA: number
  yearToDate: number
  aopVsPlan: number
  pnl: number
  regions: RegionData[]
}

const usePerformanceData = (
  filters: any[] = [],
  asOfDate?: string
) => {
  return useQuery({
    queryKey: ['performance-data', filters, asOfDate],
    queryFn: async (): Promise<DeskPerformanceData[]> => {
      // Mock hierarchical data with desk and region breakdown
      const mockData: DeskPerformanceData[] = [
        {
          desk: "Structured Equity Products",
          returnRWA: 12.4,
          yearToDate: 8.7,
          aopVsPlan: 104,
          pnl: Math.random() * 1000000 + 500000,
          regions: [
            {
              region: "EMEA",
              returnRWA: 13.1,
              yearToDate: 9.2,
              aopVsPlan: 106,
              pnl: Math.random() * 500000 + 250000
            },
            {
              region: "Americas",
              returnRWA: 11.8,
              yearToDate: 8.3,
              aopVsPlan: 103,
              pnl: Math.random() * 400000 + 200000
            },
            {
              region: "APAC",
              returnRWA: 12.2,
              yearToDate: 8.6,
              aopVsPlan: 102,
              pnl: Math.random() * 300000 + 150000
            }
          ]
        },
        {
          desk: "Cash Financing Sol",
          returnRWA: 9.1,
          yearToDate: 6.3,
          aopVsPlan: 99,
          pnl: Math.random() * 800000 + 400000,
          regions: [
            {
              region: "EMEA",
              returnRWA: 9.8,
              yearToDate: 6.9,
              aopVsPlan: 101,
              pnl: Math.random() * 400000 + 200000
            },
            {
              region: "Americas",
              returnRWA: 8.5,
              yearToDate: 5.8,
              aopVsPlan: 97,
              pnl: Math.random() * 350000 + 175000
            }
          ]
        },
        {
          desk: "Structured Index Products",
          returnRWA: 10.7,
          yearToDate: 7.9,
          aopVsPlan: 101,
          pnl: Math.random() * 900000 + 450000,
          regions: [
            {
              region: "EMEA",
              returnRWA: 11.3,
              yearToDate: 8.4,
              aopVsPlan: 103,
              pnl: Math.random() * 450000 + 225000
            },
            {
              region: "Americas",
              returnRWA: 10.1,
              yearToDate: 7.5,
              aopVsPlan: 99,
              pnl: Math.random() * 300000 + 150000
            },
            {
              region: "APAC",
              returnRWA: 10.9,
              yearToDate: 7.8,
              aopVsPlan: 101,
              pnl: Math.random() * 250000 + 125000
            }
          ]
        },
        {
          desk: "Structured Commodity Products",
          returnRWA: 6.2,
          yearToDate: 4.1,
          aopVsPlan: 92,
          pnl: Math.random() * 600000 + 300000,
          regions: [
            {
              region: "EMEA",
              returnRWA: 6.8,
              yearToDate: 4.5,
              aopVsPlan: 94,
              pnl: Math.random() * 300000 + 150000
            },
            {
              region: "Americas",
              returnRWA: 5.7,
              yearToDate: 3.8,
              aopVsPlan: 90,
              pnl: Math.random() * 200000 + 100000
            }
          ]
        }
      ]

      return mockData
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  })
}

export function PerformanceTableCard({ className, asOfDate, filters = [] }: PerformanceTableCardProps) {
  const { data: performanceData = [], isLoading, error } = usePerformanceData(filters, asOfDate)

  if (isLoading) {
    return (
      <Card className={cn("min-h-[300px]", className)}>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("min-h-[300px]", className)}>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <AlertCircle className="size-4 text-destructive" />
            <span className="text-sm text-destructive">Error loading data</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data for desks
  const deskChartData = performanceData.map((desk, index) => ({
    name: desk.desk,
    value: Math.abs(desk.pnl),
    color: index === 0 ? '#374151' : index === 1 ? '#4b5563' : index === 2 ? '#6b7280' : '#9ca3af'
  }))

  // Prepare chart data for regions (aggregate P&L by region)
  const regionPnlMap = new Map<string, number>()
  performanceData.forEach(desk => {
    desk.regions.forEach(region => {
      const currentPnl = regionPnlMap.get(region.region) || 0
      regionPnlMap.set(region.region, currentPnl + Math.abs(region.pnl))
    })
  })

  const regionChartData = Array.from(regionPnlMap.entries()).map(([region, pnl], index) => ({
    name: region,
    value: pnl,
    color: index === 0 ? '#475569' : index === 1 ? '#64748b' : '#94a3b8'
  }))

  const formatCurrency = (value: number) => {
    const millions = Math.abs(value) / 1000000
    return `$${millions.toFixed(1)}M`
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Performance by Desk</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          {/* Left side - Table */}
          <div className="col-span-2 space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border text-sm font-medium text-muted-foreground">
              <div>Desk</div>
              <div className="text-center">Return RWA</div>
              <div className="text-center">Year to date</div>
              <div className="text-left pl-4">AOP vs Plan</div>
            </div>

          {/* Hierarchical Data Rows */}
          {performanceData.map((desk, deskIndex) => (
            <div key={desk.desk} className="space-y-1">
              {/* Desk Row */}
              <div className="grid grid-cols-4 gap-4 items-center py-2 bg-muted/20 rounded-sm">
                <div className="flex items-center">
                  <span className="text-sm font-semibold">{desk.desk}</span>
                </div>
                <div className="text-center text-sm font-semibold">
                  {desk.returnRWA.toFixed(1)}%
                </div>
                <div className="text-center text-sm font-semibold">
                  {desk.yearToDate.toFixed(1)}%
                </div>
                <div className="flex items-center space-x-3 pl-4">
                  <div className="flex-1 bg-gray-200 h-4 relative overflow-hidden border border-gray-300">
                    <div 
                      className="h-full relative animate-in slide-in-from-left-full duration-[800ms] ease-out"
                      style={{ 
                        backgroundColor: '#374151',
                        width: `${Math.max(Math.min(desk.aopVsPlan, 100), 2)}%`,
                        minWidth: desk.aopVsPlan > 0 ? '2px' : '0px',
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      {/* Gradient overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
                    </div>
                    {/* Target line at 100% */}
                    <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-600 animate-in fade-in duration-1000 delay-300" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 min-w-[32px]">
                    {desk.aopVsPlan}%
                  </div>
                </div>
              </div>

              {/* Region Sub-rows */}
              {desk.regions.map((region, regionIndex) => (
                <div key={`${desk.desk}-${region.region}`} className="grid grid-cols-4 gap-4 items-center py-1 pl-6">
                  <div className="flex items-center pl-4">
                    <span className="text-xs text-muted-foreground">{region.region}</span>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    {region.returnRWA.toFixed(1)}%
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    {region.yearToDate.toFixed(1)}%
                  </div>
                  <div className="flex items-center space-x-2 pl-4">
                    <div className="flex-1 bg-gray-100 h-2.5 relative overflow-hidden border border-gray-200">
                      <div 
                        className="h-full relative animate-in slide-in-from-left-full ease-out"
                        style={{ 
                          backgroundColor: '#6b7280',
                          width: `${Math.max(Math.min(region.aopVsPlan, 100), 1.5)}%`,
                          minWidth: region.aopVsPlan > 0 ? '1.5px' : '0px',
                          opacity: 0.8,
                          animationDuration: `${600 + regionIndex * 100}ms`,
                          animationDelay: `${200 + regionIndex * 150}ms`,
                          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        {/* Subtle gradient for region bars */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
                        {/* Smaller shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{ animationDuration: '2.5s' }} />
                      </div>
                      {/* Smaller target line */}
                      <div className="absolute right-0 top-0 h-full w-px bg-gray-400 animate-in fade-in duration-700" style={{ animationDelay: `${400 + regionIndex * 150}ms` }} />
                    </div>
                    <div className="text-[10px] font-medium text-slate-600 min-w-[28px]">
                      {region.aopVsPlan}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          </div>
          
          {/* Right side - Pie Charts */}
          <div className="col-span-1">
            <div className="space-y-6">
              {/* P&L by Desk Chart */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-700">P&L by Desk</h3>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={1}
                      >
                        {deskChartData.map((entry, index) => (
                          <Cell key={`desk-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'P&L']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Desk Legend */}
                <div className="space-y-1">
                  {deskChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <div
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 truncate text-[10px]">{item.name}</span>
                      </div>
                      <span className="font-medium text-slate-700 text-[10px]">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* P&L by Region Chart */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-700">P&L by Region</h3>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={1}
                      >
                        {regionChartData.map((entry, index) => (
                          <Cell key={`region-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'P&L']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Region Legend */}
                <div className="space-y-1">
                  {regionChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <div
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 truncate text-[10px]">{item.name}</span>
                      </div>
                      <span className="font-medium text-slate-700 text-[10px]">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}