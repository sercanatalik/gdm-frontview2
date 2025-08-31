"use client"

import * as React from "react"
import { useStore } from "@tanstack/react-store"
import { Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { filtersStore, filtersActions } from "@/lib/store/filters"
import { cn } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"

interface AsOfDateSelectProps {
  tableName?: string
  className?: string
}

export function AsOfDateSelect({ 
  tableName = "trade_book_instrument_mv", 
  className = "" 
}: AsOfDateSelectProps) {
  const [dates, setDates] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)

  // Fetch available dates
  React.useEffect(() => {
    const fetchDates = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/gdm-frontview/api/tables/distinct?table=${tableName}&column=asOfDate`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dates: ${response.statusText}`)
        }
        
        const fetchedDates = await response.json()
        if (Array.isArray(fetchedDates)) {
          // Sort dates in descending order (latest first)
          const sortedDates = fetchedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          setDates(sortedDates)
          
          // Set the latest date as default if no date is selected
          if (sortedDates.length > 0 && !asOfDate) {
            filtersActions.setAsOfDate(sortedDates[0])
          }
        }
      } catch (err) {
        console.error('Error fetching dates:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch dates')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDates()
  }, [tableName, asOfDate])

  const handleDateChange = (selectedDate: string) => {
    filtersActions.setAsOfDate(selectedDate)
  }

  return (
    <div className={cn("group flex items-center gap-2", className)}>
    
      <Select 
        value={asOfDate || ""} 
        onValueChange={handleDateChange}
        disabled={isLoading || dates.length === 0}
      >
        <SelectTrigger 
          className={cn(
            "transition h-8 text-sm rounded-sm border-none bg-transparent hover:bg-accent hover:text-accent-foreground gap-1.5 px-3 w-auto min-w-[100px]",
            isLoading && "opacity-50",
            error && "text-destructive"
          )}
        >
          <Calendar className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-all" />
          <SelectValue placeholder={isLoading ? "Loading..." : "Select Date"} />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[400px]">
            {dates.map((date) => (
              <SelectItem key={date} value={date}>
                {date}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  )
}