"use client"

import * as React from "react"
import { type ChartConfig } from "@/components/ui/chart"

// Color palettes
export const MULTI_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-8))",
  "hsl(var(--chart-10))",
]

export const MONOCHROME_COLORS = [
  '#0a0e15',  // Very dark (almost black)
  '#2a3441',  // Dark gray-blue
  '#525c6a',  // Medium gray
  '#7f8b9b',  // Light gray-blue
  '#b8c1ce',  // Very light gray
]

// Field and GroupBy options
export const FIELD_OPTIONS = [
  { value: "fundingAmount", label: "Cash Out" },
  { value: "collateralAmount", label: "Notional Amount" },
]

// Utilities
export const formatCurrency = (value: number): string => {
  const millions = value / 1000000
  return `$${millions.toFixed(1)}M`
}

export const sanitizeKey = (key: string): string => {
  return String(key).replace(/[^a-zA-Z0-9]/g, '_')
}

export const generateChartConfig = (data: Record<string, unknown>[], isStacked: boolean = false): ChartConfig => {
  const uniqueGroups = [...new Set(
    data.flatMap(item => 
      Object.keys(item).filter(key => key !== 'date' && key !== 'fullDate')
    )
  )].filter(Boolean)
  
  // Sort groups to ensure "Others" is always last
  uniqueGroups.sort((a, b) => {
    if (a === 'Others') return 1
    if (b === 'Others') return -1
    return 0
  })
  
  const config: ChartConfig = {}
  
  if (isStacked) {
    // For stacked charts, use monochrome colors with high contrast
    uniqueGroups.forEach((group, index) => {
      const sanitizedKey = sanitizeKey(group)
      let color: string
      
      if (sanitizedKey === 'Others') {
        // Use the lightest color for "Others"
        color = MONOCHROME_COLORS[MONOCHROME_COLORS.length - 1]
      } else {
        // Distribute other colors evenly across the darker spectrum
        color = MONOCHROME_COLORS[Math.min(index, MONOCHROME_COLORS.length - 2)]
      }
      
      config[sanitizedKey] = {
        label: group === 'Others' ? 'Others' : group,
        color,
      }
    })
  } else {
    // For non-stacked charts, use multi-colors
    uniqueGroups.forEach((group, index) => {
      const sanitizedKey = sanitizeKey(group)
      const color = sanitizedKey === 'Others' 
        ? 'hsl(var(--muted-foreground))' 
        : MULTI_COLORS[index % MULTI_COLORS.length]
      
      config[sanitizedKey] = {
        label: group === 'Others' ? 'Others' : group,
        color,
      }
    })
  }
  
  return config
}

// Custom Tooltip Component
export const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ payload: { fullDate: string }, color: string, name: string, value: number }>
  label?: string
}) => {
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
}