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
  Loader2,
  AlertCircle,
} from "lucide-react"
import { nanoid } from "nanoid"
import * as React from "react"
import { useStore } from "@tanstack/react-store"
import { AnimateChangeInHeight } from "@/components/ui/filters"
import Filters, { type Filter, type FilterOption, type FilterConfig } from "@/components/ui/filters"
import { filtersStore, filtersActions, filtersSelectors } from "@/lib/store/filters"

// Types
interface RiskFilterProps {
  tableName?: string
  filterTypes?: Record<string, string>
  filterOperators?: Record<string, string>
  iconMapping?: Record<string, React.ReactNode>
  operatorConfig?: Record<string, any>
  dateValues?: string[]
}

// Helper functions - moved to /lib/query/filter-options.ts

// Main component
export function RiskFilter({ 
  tableName = "risk_mv",
  filterTypes = {},
  filterOperators = {},
  iconMapping = {},
  operatorConfig = {},
  dateValues = []
}: RiskFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedView, setSelectedView] = React.useState<string | null>(null)
  const [commandInput, setCommandInput] = React.useState("")
  const commandInputRef = React.useRef<HTMLInputElement | null>(null)

  // Use store for filters with optimized selectors
  const filters = useStore(filtersStore, (state) => state.filters)
  const activeTable = useStore(filtersStore, (state) => state.activeTable)
  
  // Memoize active filters to prevent unnecessary re-renders
  const activeFilters = React.useMemo(() => 
    filters.filter(filter => filter.value?.length > 0), 
    [filters]
  )

  // Set active table when component mounts
  React.useEffect(() => {
    if (tableName !== activeTable) {
      filtersActions.setActiveTable(tableName)
    }
  }, [tableName, activeTable])

  // Wrapper for setFilters to match React.Dispatch type
  const setFilters = React.useCallback((value: React.SetStateAction<Filter[]>) => {
    if (typeof value === 'function') {
      const newFilters = value(filters)
      filtersActions.setFilters(newFilters)
    } else {
      filtersActions.setFilters(value)
    }
  }, [filters])

  const [filterOptions, setFilterOptions] = React.useState<{
    [key: string]: FilterOption[]
  }>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Memoize filter types keys to prevent unnecessary re-renders
  const filterTypeKeys = React.useMemo(() => Object.keys(filterTypes), [filterTypes])
  
  // Cache key for filter options to prevent unnecessary API calls
  const cacheKey = React.useMemo(() => 
    `${tableName}-${JSON.stringify(filterTypes)}`, 
    [tableName, filterTypes]
  )

  // Load filter options based on provided filterTypes
  React.useEffect(() => {
    if (filterTypeKeys.length === 0) return

    const loadFilterOptions = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const options: { [key: string]: FilterOption[] } = {}
        
        // Load all filter options in parallel for better performance
        const promises = Object.entries(filterTypes).map(async ([key, columnName]) => {
          const response = await fetch(`/gdm-frontview/api/tables/distinct?table=${tableName}&column=${columnName}`)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${key} options: ${response.statusText}`)
          }
          
          const values = await response.json()
          const filterOptionValues = Array.isArray(values) ? values.map((value: string) => ({
            name: value,
            icon: undefined,
          })) : []
          
          // Apply icon mapping if provided
          if (iconMapping) {
            options[key] = filterOptionValues.map((option) => ({
              name: option.name,
              icon: iconMapping[option.name] || iconMapping[key],
            }))
          } else {
            options[key] = filterOptionValues
          }
        })

        await Promise.all(promises)
        setFilterOptions(options)
      } catch (err) {
        console.error('Error loading filter options:', err)
        setError(err instanceof Error ? err.message : 'Failed to load filter options')
      } finally {
        setIsLoading(false)
      }
    }

    loadFilterOptions()
  }, [cacheKey, filterTypeKeys, iconMapping])

  // Filter configuration - memoized to prevent unnecessary re-renders
  const filterConfig: FilterConfig = React.useMemo(() => ({
    filterTypes,
    filterOperators,
    filterViewOptions: [
      filterTypeKeys.map(key => ({
        name: key,
        icon: iconMapping[key],
      })),
      [],
    ],
    filterViewToFilterOptions: filterOptions,
  }), [filterTypes, filterOperators, filterTypeKeys, iconMapping, filterOptions])

  // Handle adding a new filter
  const handleAddFilter = (filterType: string, filterValue: string) => {
    const config = operatorConfig[filterType]
    const defaultOperator = config?.operators?.[0] || "is"
    const field = config?.field || filterType
    
    // Check if a filter with the same type and field already exists
    const existingFilter = filters.find(f => f.type === filterType && f.field === field)
    
    if (existingFilter) {
      // If filter exists, update its value instead of creating a new one
      const updatedValues = existingFilter.value.includes(filterValue) 
        ? existingFilter.value 
        : [...existingFilter.value, filterValue]
      
      filtersActions.updateFilter(existingFilter.id, { value: updatedValues })
    } else {
      // Create new filter if none exists
      const newFilter = {
        id: nanoid(),
        type: filterType,
        operator: defaultOperator,
        value: [filterValue],
        field,
      }
      
      filtersActions.addFilter(newFilter)
    }
    
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

      {activeFilters.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="transition h-6 border-none text-xs text-muted-foreground hover:bg-transparent hover:text-red-500"
          onClick={() => filtersActions.clearFilters()}
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
        isLoading={isLoading}
        error={error}
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
  commandInputRef: React.RefObject<HTMLInputElement | null>
  filterOptions: Record<string, FilterOption[]>
  filters: Filter[]
  onAddFilter: (filterType: string, filterValue: string) => void
  filterTypes: Record<string, string>
  iconMapping: Record<string, React.ReactNode>
  isLoading: boolean
  error: string | null
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
  isLoading,
  error,
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
          disabled={isLoading}
          className={cn(
            "transition group h-8 text-sm items-center rounded-sm flex gap-1.5 items-center",
            filters.length > 0 && "w-8",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : error ? (
            <AlertCircle className="size-4 shrink-0 text-destructive" />
          ) : (
            <ListFilter className="size-4 shrink-0 transition-all text-muted-foreground group-hover:text-primary" />
          )}
          {!filters.length && !isLoading && "Filter"}
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
  commandInputRef: React.RefObject<HTMLInputElement | null>
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