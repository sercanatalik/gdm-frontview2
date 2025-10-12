import { cn } from "@/lib/utils"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { fmtUSD } from "./utils"

type MiniDonutProps = {
  title: string
  data: { key: string; name: string; value: number; color: string }[]
  noteClass?: string
}

export function MiniDonut({ title, data, noteClass }: MiniDonutProps) {
  return (
    <div className="rounded-lg">
      <div className="mb-3 text-[15px] font-semibold text-slate-900">{title}</div>
      <div className="grid grid-cols-[180px_1fr] items-center gap-4">
        <div className="h-[160px] w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={46}
                outerRadius={74}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={8}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className={cn("truncate text-sm text-slate-700", noteClass)}>{d.name}</span>
              <span className="text-sm text-slate-700 tabular-nums">{fmtUSD(d.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
