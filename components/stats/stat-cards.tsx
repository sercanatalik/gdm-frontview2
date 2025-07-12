"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStatsData, type StatMeasure, type StatConfig, formatters } from "@/lib/query/stats"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, BarChart3 } from "lucide-react"

interface StatCardsProps {
  measures: StatMeasure[]
  period?: string
  className?: string
}

interface StatData {
  current: number
  previous: number
  change: number
  changePercent: number
}

function getTrendDisplay(data?: StatData) {
  if (!data || data.change === 0) {
    return {
      icon: <Minus className="size-4 text-muted-foreground" />,
      color: "text-muted-foreground"
    }
  }
  
  const isPositive = data.change > 0
  return {
    icon: isPositive 
      ? <TrendingUp className="size-4 text-green-500" />
      : <TrendingDown className="size-4 text-red-500" />,
    color: isPositive ? "text-green-500" : "text-red-500"
  }
}

function StatCard({ measure, data, isLoading, error }: {
  measure: StatMeasure
  data?: StatData
  isLoading?: boolean
  error?: string
}) {
  const formatValue = measure.formatter || formatters.number
  const trend = getTrendDisplay(data)

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{measure.label}</CardTitle>
          {measure.icon || <BarChart3 className="size-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{measure.label}</CardTitle>
          {measure.icon || <BarChart3 className="size-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <AlertCircle className="size-4 text-destructive" />
            <span className="text-sm text-destructive">Error loading data</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{measure.label}</CardTitle>
        {measure.icon || <BarChart3 className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="space-y-1">
            <div className="text-2xl font-bold">{formatValue(data.current)}</div>
            <div className="flex items-center space-x-1 text-xs">
              {trend.icon}
              <span className={cn("font-medium", trend.color)}>
                {Math.abs(data.changePercent).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs previous period</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Previous: {formatValue(data.previous)}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatCards({ measures, period = '1d', className }: StatCardsProps) {
  const { data, isLoading, error } = useStatsData(measures, period)

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {measures.map((measure) => (
        <StatCard
          key={measure.key}
          measure={measure}
          data={data?.[measure.key]}
          isLoading={isLoading}
          error={error?.message}
        />
      ))}
    </div>
  )
}

// Default measure configurations
export const defaultStatConfigs = {
  financial: [
    {
      key: 'revenue',
      label: 'Revenue',
      field: 'amount',
      tableName: 'risk_f_mv',
      aggregation: 'sum' as const,
      formatter: formatters.currency,
    },
    {
      key: 'transactions',
      label: 'Transactions',
      field: 'id',
      tableName: 'risk_f_mv',
      aggregation: 'count' as const,
      formatter: formatters.number,
    },
    {
      key: 'avg_amount',
      label: 'Avg Amount',
      field: 'amount',
      tableName: 'risk_f_mv',
      aggregation: 'avg' as const,
      formatter: formatters.currency,
    },
    {
      key: 'users',
      label: 'Active Users',
      field: 'user_id',
      tableName: 'risk_f_mv',
      aggregation: 'count' as const,
      formatter: formatters.number,
    },
  ],
  
  trading: [
    {
      key: 'cashOut',
      label: 'Total cashOut&L',
      field: 'cashOut',
      tableName: 'risk_f_mv',
      aggregation: 'sum' as const,
      formatter: formatters.currency,
    },
    {
      key: 'tradeCount',
      label: 'Trade Count',
      field: 'id',
      tableName: 'risk_f_mv',
      aggregation: 'count' as const,
      formatter: formatters.number,
    },
    {
      key: 'underlyingAmount',
      label: 'Avg Position',
      field: 'underlyingAmount',
      tableName: 'risk_f_mv',
      aggregation: 'avg' as const,
      formatter: formatters.currency,
    },
    {
      key: 'active_desks',
      label: 'Active Desks',
      field: 'desk',
      tableName: 'risk_f_mv',
      aggregation: 'count' as const,
      formatter: formatters.number,
    },
  ],
}

export type { StatMeasure, StatConfig }