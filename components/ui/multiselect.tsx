"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      handleUnselect(item)
    } else {
      onChange([...selected, item])
    }
  }

  const handleSelectAll = () => {
    onChange(options)
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-9 h-auto",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap items-center gap-1">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selected.slice(0, 3).map((item) => (
              <Badge
                variant="secondary"
                key={item}
                className="mr-1 mb-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnselect(item)
                }}
              >
                {item}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(item)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUnselect(item)
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
            {selected.length > 3 && (
              <Badge variant="secondary" className="mr-1 mb-1">
                +{selected.length - 3} more
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tools..." />
          <CommandList>
            <CommandEmpty>No tools found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
            {options.length > 0 && (
              <div className="border-t p-2">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}