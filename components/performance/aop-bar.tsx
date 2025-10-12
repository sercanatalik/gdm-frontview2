import { cn } from "@/lib/utils"

type AopBarProps = {
  value: number
  className?: string
}

export function AopBar({ value, className }: AopBarProps) {
  const capped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-2.5 w-full rounded-full bg-slate-200">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-400"
          style={{ width: `${capped}%` }}
        />
        {/* subtle highlight toward the end for polish */}
        <div className="absolute inset-y-0 right-0 w-3 rounded-r-full bg-white/50" />
      </div>
      <div className="w-12 text-right text-[13px] font-medium text-slate-800 tabular-nums">
        {Math.round(value)}%
      </div>
    </div>
  )
}
