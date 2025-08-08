"use client"

import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Datum = {
  key: "equity" | "cash" | "index" | "commodity"
  name: string
  value: number
  color: string
}

const data: Datum[] = [
  { key: "equity", name: "Structured Equity Products", value: 40.2, color: "#2f3945" },
  { key: "cash", name: "Cash Financing Sol", value: 33.6, color: "#4b5563" },
  { key: "index", name: "Structured Index Products", value: 19.3, color: "#5b6471" },
  { key: "commodity", name: "Structured Commodity Products", value: 6.8, color: "#9aa3ae" },
]

// Provide a consistent mapping for ChartContainer so we can use var(--color-*)
const chartConfig = {
  equity: { label: "Structured Equity Products", color: data[0].color },
  cash: { label: "Cash Financing Sol", color: data[1].color },
  index: { label: "Structured Index Products", color: data[2].color },
  commodity: { label: "Structured Commodity Products", color: data[3].color },
} as const

const RAD = Math.PI / 180

function renderLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, percent, name } = props
  const r = outerRadius + 56 // push labels outward to mimic screenshot
  const x = cx + r * Math.cos(-midAngle * RAD)
  const y = cy + r * Math.sin(-midAngle * RAD)
  const anchor = x > cx ? "start" : "end"
  const pct = (percent * 100).toFixed(1)
  return (
    <text
      x={x}
      y={y}
      fill="#64748b"
      fontSize={15}
      textAnchor={anchor}
      dominantBaseline="central"
    >
      {name + ": (" + pct + "%)"}
    </text>
  )
}

export default function DonutBreakdown() {
  // The chart is intentionally large and airy to match the reference
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[520px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel={false}
                indicator="dot"
                nameKey="name"
                valueFormatter={(v) => (typeof v === "number" ? v.toFixed(1) + "%" : String(v))}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={120}
            outerRadius={190}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            labelLine={false}
            label={renderLabel}
            stroke="#ffffff"
            strokeWidth={8} // creates the subtle gaps between segments
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
    