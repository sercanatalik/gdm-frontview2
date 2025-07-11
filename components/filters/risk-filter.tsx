"use client"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  ListFilter,
  Trash2,
} from "lucide-react"
import { nanoid } from "nanoid"
import * as React from "react"
import { AnimateChangeInHeight } from "@/components/ui/filters"
import Filters, { type Filter, type FilterOption, type FilterConfig } from "@/components/ui/filters"

// Types
interface RiskFilterProps {
  filters: Filter[]
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>
  tableName?: string
  filterTypes?: Record<string, string>
  filterOperators?: Record<string, string>
  iconMapping?: Record<string, React.ReactNode>
  operatorConfig?: Record<string, any>
  dateValues?: string[]
}

// Helper functions
const fetchFilterOptions = async (tableName: string, columnName: string): Promise<FilterOption[]> => {
  try {
    const response = await fetch(`/api/tables/distinct?table=${tableName}&column=${columnName}`)
    const values = await response.json()
    return values.map((value: string) => ({
      name: value,
      icon: undefined,
    }))
  } catch (error) {
    console.error(`Error fetching filter options for ${tableName}.${columnName}:`, error)
    return []
  }
}

// Main component
export function RiskFilter({ 
  filters, 
  setFilters, 
  tableName = "risk_f_mv",
  filterTypes = {},
  filterOperators = {},
  iconMapping = {},
  operatorConfig = {},
  dateValues = []
}: RiskFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedView, setSelectedView] = React.useState<string | null>(null)
  const [commandInput, setCommandInput] = React.useState("")
  const commandInputRef = React.useRef<HTMLInputElement>(null)

  const [filterOptions, setFilterOptions] = React.useState<{
    [key: string]: FilterOption[]
  }>({})

  // Load filter options based on provided filterTypes
  React.useEffect(() => {
    if (Object.keys(filterTypes).length === 0) return

    const loadFilterOptions = async () => {
      const options: { [key: string]: FilterOption[] } = {}
      
      for (const [key, columnName] of Object.entries(filterTypes)) {
        options[key] = await fetchFilterOptions(tableName, columnName)
        
        // Apply icon mapping if provided
        if (iconMapping) {
          options[key] = options[key].map((option) => ({
            name: option.name,
            icon: iconMapping[option.name] || iconMapping[key],
          }))
        }
      }

      setFilterOptions(options)
    }

    loadFilterOptions()
  }, [tableName, filterTypes, iconMapping])

  // Filter configuration
  const filterConfig: FilterConfig = {
    filterTypes,
    filterOperators,
    filterViewOptions: [
      Object.keys(filterTypes).map(key => ({
        name: key,
        icon: iconMapping[key],
      })),
      [],
    ],
    filterViewToFilterOptions: filterOptions,
  }

  // Handle adding a new filter
  const handleAddFilter = (filterType: string, filterValue: string) => {
    const defaultOperator = Object.keys(filterOperators)[0] || "is"
    
    setFilters((prev: Filter[]) => [
      ...prev,
      {
        id: nanoid(),
        type: filterType,
        operator: defaultOperator,
        value: [filterValue],
      },
    ])
    
    setTimeout(() => {
      setSelectedView(null)
      setCommandInput("")
    }, 200)
    setOpen(false)
  }

  // Don't render if no configuration provided
  if (Object.keys(filterTypes).length === 0) {
    return null
  }

  return (
    <div className="flex gap-5 flex-wrap items-center z-50">
      <Filters
        filters={filters}
        setFilters={setFilters}
        config={filterConfig}
        iconMapping={iconMapping}
        dateValues={dateValues}
        operatorConfig={operatorConfig}
      />

      {filters.filter((filter) => filter.value?.length > 0).length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="transition h-6 border-none text-xs text-muted-foreground hover:bg-transparent hover:text-red-500"
          onClick={() => setFilters([])}
        >
          <Trash2 className="size-3 mr-0" />
          Reset
        </Button>
      )}

      <FilterPopover
        open={open}
        setOpen={setOpen}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        commandInput={commandInput}
        setCommandInput={setCommandInput}
        commandInputRef={commandInputRef}
        filterOptions={filterOptions}
        filters={filters}
        onAddFilter={handleAddFilter}
        filterTypes={filterTypes}
        iconMapping={iconMapping}
      />
    </div>
  )
}

// Filter popover component
interface FilterPopoverProps {
  open: boolean
  setOpen: (open: boolean) => void
  selectedView: string | null
  setSelectedView: (view: string | null) => void
  commandInput: string
  setCommandInput: (input: string) => void
  commandInputRef: React.RefObject<HTMLInputElement>
  filterOptions: Record<string, FilterOption[]>
  filters: Filter[]
  onAddFilter: (filterType: string, filterValue: string) => void
  filterTypes: Record<string, string>
  iconMapping: Record<string, React.ReactNode>
}

function FilterPopover({
  open,
  setOpen,
  selectedView,
  setSelectedView,
  commandInput,
  setCommandInput,
  commandInputRef,
  filterOptions,
  filters,
  onAddFilter,
  filterTypes,
  iconMapping,
}: FilterPopoverProps) {
  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          setTimeout(() => {
            setSelectedView(null)
            setCommandInput("")
          }, 200)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          size="sm"
          className={cn(
            "transition group h-8 text-sm items-center rounded-sm flex gap-1.5 items-center",
            filters.length > 0 && "w-8",
          )}
        >
          <ListFilter className="size-4 shrink-0 transition-all text-muted-foreground group-hover:text-primary" />
          {!filters.length && "Filter"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={selectedView ? selectedView : "Filter..."}
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => {
                setCommandInput(e.currentTarget.value)
              }}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {selectedView ? (
                <CommandGroup className="flex flex-col gap-2" key={selectedView}>
                  {filterOptions[selectedView]?.map((filter: FilterOption) => (
                    <CommandItem
                      className="group text-muted-foreground flex gap-2 items-center"
                      key={filter.name}
                      value={filter.name}
                      onSelect={(currentValue) => onAddFilter(selectedView, currentValue)}
                    >
                      {filter.icon}
                      <span className="text-accent-foreground">{filter.name}</span>
                      {filter.label && <span className="text-muted-foreground text-xs ml-auto">{filter.label}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <FilterTypeGroups 
                  setSelectedView={setSelectedView} 
                  commandInputRef={commandInputRef}
                  filterTypes={filterTypes}
                  iconMapping={iconMapping}
                />
              )}
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  )
}

// Filter type groups component
interface FilterTypeGroupsProps {
  setSelectedView: (view: string) => void
  commandInputRef: React.RefObject<HTMLInputElement>
  filterTypes: Record<string, string>
  iconMapping: Record<string, React.ReactNode>
}

function FilterTypeGroups({ setSelectedView, commandInputRef, filterTypes, iconMapping }: FilterTypeGroupsProps) {
  const filterGroups = [
    Object.keys(filterTypes).map(key => ({
      name: key,
      icon: iconMapping[key],
    })),
  ]

  return (
    <>
      {filterGroups.map((group: FilterOption[], groupIndex) => (
        <CommandGroup key={`group-${groupIndex}-${nanoid()}`} className="flex flex-col gap-2">
          {group.map((filter: FilterOption) => (
            <CommandItem
              className="group text-muted-foreground flex gap-2 items-center"
              key={`${filter.name}-${nanoid()}`}
              value={filter.name}
              onSelect={(currentValue) => {
                setSelectedView(currentValue as string)
                commandInputRef.current?.focus()
              }}
            >
              {filter.icon}
              <span className="text-accent-foreground">{filter.name}</span>
            </CommandItem>
          ))}
          {groupIndex < filterGroups.length - 1 && <CommandSeparator />}
        </CommandGroup>
      ))}
    </>
  )
}