"use client"

import type React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, CircleDashed, X } from "lucide-react"
import { type Dispatch, type SetStateAction, useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "motion/react"

interface AnimateChangeInHeightProps {
  children: React.ReactNode
  className?: string
}

export const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | "auto">("auto")

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        // We only have one entry, so we can use entries[0].
        const observedHeight = entries[0].contentRect.height
        setHeight(observedHeight)
      })

      resizeObserver.observe(containerRef.current)

      return () => {
        // Cleanup the observer when the component is unmounted
        resizeObserver.disconnect()
      }
    }
  }, [])

  return (
    <motion.div
      className={cn(className, "overflow-hidden")}
      style={{ height }}
      animate={{ height }}
      transition={{ duration: 0.1, damping: 0.2, ease: "easeIn" }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  )
}

export type FilterType = string
export type FilterOperator = string

export interface Filter {
  id: string
  type: FilterType
  operator: FilterOperator
  value: string[]
}

export interface FilterOption {
  name: string
  icon: React.ReactNode | undefined
  label?: string
}

export interface FilterConfig {
  filterTypes: Record<string, string>
  filterOperators: Record<string, string>
  filterViewOptions: FilterOption[][]
  filterViewToFilterOptions: Record<string, FilterOption[]>
}

const FilterIcon = ({
  type,
  iconMapping,
}: {
  type: string
  iconMapping: Record<string, React.ReactNode>
}) => {
  return iconMapping[type] || <CircleDashed className="size-3.5" />
}

const getFilterOperators = ({
  filterType,
  filterValues,
  operatorConfig,
  dateValues,
}: {
  filterType: string
  filterValues: string[]
  operatorConfig: Record<string, Record<string, string[]>>
  dateValues: string[]
}): string[] => {
  const config = operatorConfig[filterType]
  if (!config) return []

  if (filterType.includes("DATE")) {
    if (filterValues?.some((value) => dateValues.includes(value))) {
      return config.past || []
    } else {
      return config.date || []
    }
  }

  if (Array.isArray(filterValues) && filterValues.length > 1) {
    return config.multiple || []
  } else {
    return config.single || []
  }
}

const FilterOperatorDropdown = ({
  filterType,
  operator,
  filterValues,
  setOperator,
  operatorConfig,
  dateValues,
}: {
  filterType: string
  operator: string
  filterValues: string[]
  setOperator: (operator: string) => void
  operatorConfig: Record<string, Record<string, string[]>>
  dateValues: string[]
}) => {
  const operators = getFilterOperators({
    filterType,
    filterValues,
    operatorConfig,
    dateValues,
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-muted hover:bg-muted/50 px-1.5 py-1 text-muted-foreground hover:text-primary transition shrink-0">
        {operator}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {operators.map((operator) => (
          <DropdownMenuItem key={operator} onClick={() => setOperator(operator)}>
            {operator}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const FilterValueCombobox = ({
  filterType,
  filterValues,
  setFilterValues,
  filterViewToFilterOptions,
  iconMapping,
}: {
  filterType: string
  filterValues: string[]
  setFilterValues: (filterValues: string[]) => void
  filterViewToFilterOptions: Record<string, FilterOption[]>
  iconMapping: Record<string, React.ReactNode>
}) => {
  const [open, setOpen] = useState(false)
  const [commandInput, setCommandInput] = useState("")
  const commandInputRef = useRef<HTMLInputElement>(null)
  const nonSelectedFilterValues = filterViewToFilterOptions[filterType]?.filter(
    (filter) => !filterValues.includes(filter.name),
  )
  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          setTimeout(() => {
            setCommandInput("")
          }, 200)
        }
      }}
    >
      <PopoverTrigger
        className="rounded-none px-1.5 py-1 bg-muted hover:bg-muted/50 transition
  text-muted-foreground hover:text-primary shrink-0"
      >
        <div className="flex gap-1.5 items-center">
          {!filterType.includes("REGION") && (
            <div
              className={cn(
                "flex items-center flex-row",
                filterType.includes("PORTFOLIO") ? "-space-x-1" : "-space-x-1.5",
              )}
            >
              <AnimatePresence mode="popLayout">
                {filterValues?.slice(0, 3).map((value) => (
                  <motion.div
                    key={value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FilterIcon type={value} iconMapping={iconMapping} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          {filterValues?.length === 1 ? filterValues?.[0] : `${filterValues?.length} selected`}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={filterType}
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => {
                setCommandInput(e.currentTarget.value)
              }}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filterValues.map((value) => (
                  <CommandItem
                    key={value}
                    className="group flex gap-2 items-center"
                    onSelect={() => {
                      setFilterValues(filterValues.filter((v) => v !== value))
                      setTimeout(() => {
                        setCommandInput("")
                      }, 200)
                      setOpen(false)
                    }}
                  >
                    <Checkbox checked={true} />
                    <FilterIcon type={value} iconMapping={iconMapping} />
                    {value}
                  </CommandItem>
                ))}
              </CommandGroup>
              {nonSelectedFilterValues?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {nonSelectedFilterValues.map((filter: FilterOption) => (
                      <CommandItem
                        className="group flex gap-2 items-center"
                        key={filter.name}
                        value={filter.name}
                        onSelect={(currentValue: string) => {
                          setFilterValues([...filterValues, currentValue])
                          setTimeout(() => {
                            setCommandInput("")
                          }, 200)
                          setOpen(false)
                        }}
                      >
                        <Checkbox checked={false} className="opacity-0 group-data-[selected=true]:opacity-100" />
                        {filter.icon}
                        <span className="text-accent-foreground">{filter.name}</span>
                        {filter.label && <span className="text-muted-foreground text-xs ml-auto">{filter.label}</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  )
}

const FilterValueDateCombobox = ({
  filterType,
  filterValues,
  setFilterValues,
  filterViewToFilterOptions,
}: {
  filterType: string
  filterValues: string[]
  setFilterValues: (filterValues: string[]) => void
  filterViewToFilterOptions: Record<string, FilterOption[]>
}) => {
  const [open, setOpen] = useState(false)
  const [commandInput, setCommandInput] = useState("")
  const commandInputRef = useRef<HTMLInputElement>(null)
  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          setTimeout(() => {
            setCommandInput("")
          }, 200)
        }
      }}
    >
      <PopoverTrigger
        className="rounded-none px-1.5 py-1 bg-muted hover:bg-muted/50 transition
  text-muted-foreground hover:text-primary shrink-0"
      >
        {filterValues?.[0]}
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={filterType}
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => {
                setCommandInput(e.currentTarget.value)
              }}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filterViewToFilterOptions[filterType].map((filter: FilterOption) => (
                  <CommandItem
                    className="group flex gap-2 items-center"
                    key={filter.name}
                    value={filter.name}
                    onSelect={(currentValue: string) => {
                      setFilterValues([currentValue])
                      setTimeout(() => {
                        setCommandInput("")
                      }, 200)
                      setOpen(false)
                    }}
                  >
                    <span className="text-accent-foreground">{filter.name}</span>
                    <Check
                      className={cn("ml-auto", filterValues.includes(filter.name) ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  )
}

interface FiltersProps {
  filters: Filter[]
  setFilters: Dispatch<SetStateAction<Filter[]>>
  config: FilterConfig
  iconMapping: Record<string, React.ReactNode>
  dateValues: string[]
  operatorConfig: Record<string, Record<string, string[]>>
}

export default function Filters({
  filters,
  setFilters,
  config,
  iconMapping,
  dateValues,
  operatorConfig,
}: FiltersProps) {
  return (
    <div className="flex gap-2">
      {filters
        .filter((filter) => filter.value?.length > 0)
        .map((filter) => (
          <div key={filter.id} className="flex gap-[1px] items-center text-xs">
            <div className="flex gap-1.5 shrink-0 rounded-l bg-muted px-1.5 py-1 items-center">
              <FilterIcon type={filter.type} iconMapping={iconMapping} />
              {filter.type}
            </div>
            <FilterOperatorDropdown
              filterType={filter.type}
              operator={filter.operator}
              filterValues={filter.value}
              operatorConfig={operatorConfig}
              dateValues={dateValues}
              setOperator={(operator) => {
                setFilters((prev) => prev.map((f) => (f.id === filter.id ? { ...f, operator } : f)))
              }}
            />
            {filter.type.includes("DATE") ? (
              <FilterValueDateCombobox
                filterType={filter.type}
                filterValues={filter.value}
                filterViewToFilterOptions={config.filterViewToFilterOptions}
                setFilterValues={(filterValues) => {
                  setFilters((prev) => prev.map((f) => (f.id === filter.id ? { ...f, value: filterValues } : f)))
                }}
              />
            ) : (
              <FilterValueCombobox
                filterType={filter.type}
                filterValues={filter.value}
                filterViewToFilterOptions={config.filterViewToFilterOptions}
                iconMapping={iconMapping}
                setFilterValues={(filterValues) => {
                  setFilters((prev) => prev.map((f) => (f.id === filter.id ? { ...f, value: filterValues } : f)))
                }}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setFilters((prev) => prev.filter((f) => f.id !== filter.id))
              }}
              className="bg-muted rounded-l-none rounded-r-sm h-6 w-6 text-muted-foreground hover:text-primary hover:bg-muted/50 transition shrink-0"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
    </div>
  )
}

