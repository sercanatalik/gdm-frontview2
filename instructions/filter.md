# Filter Component System - Regeneration Guide

This document provides detailed instructions for recreating the filter component system from the GDM FrontView application in another project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dependencies](#dependencies)
3. [File Structure](#file-structure)
4. [Core Components](#core-components)
5. [State Management](#state-management)
6. [Filter Configuration](#filter-configuration)
7. [API Integration](#api-integration)
8. [Step-by-Step Implementation](#step-by-step-implementation)
9. [Usage Examples](#usage-examples)
10. [Customization Guide](#customization-guide)

---

## Architecture Overview

The filter system consists of several interconnected components:

```
Filter System Architecture
├── Global State (TanStack Store)
│   └── filtersStore
│       ├── filters[]
│       ├── activeTable
│       └── asOfDate
├── Configuration Layer
│   ├── risk-filter.config.tsx
│   └── pnl-filter.config.tsx
├── Filter Components
│   ├── RiskFilter (main orchestrator)
│   ├── AsOfDateSelect (date picker)
│   └── Filters UI (filter chips display)
└── API Layer
    └── /api/tables/distinct (fetch filter options)
```

### Key Features
- **Dynamic filter options** fetched from database
- **Multiple filter types**: select, text, date
- **Multiple operators**: is, is not, is any of, before, after, etc.
- **Multi-select support** with checkbox UI
- **Animated height transitions** for smooth UX
- **Global state management** with TanStack Store
- **Configurable per-table** filter definitions
- **Icon mapping** for visual filter identification

---

## Dependencies

Install the following packages:

```bash
# Core framework
npm install next@15 react@19 react-dom@19

# State management
npm install @tanstack/react-store

# UI components (Radix UI)
npm install @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-dropdown-menu

# Command palette
npm install cmdk

# Animation
npm install motion

# Utilities
npm install nanoid clsx tailwind-merge class-variance-authority

# Icons
npm install lucide-react

# TypeScript
npm install -D typescript @types/react
```

### Package Versions Reference
```json
{
  "next": "^15.5.2",
  "react": "^19.0.0",
  "@tanstack/react-store": "^0.7.0",
  "@radix-ui/react-popover": "^1.1.14",
  "@radix-ui/react-select": "^2.1.14",
  "@radix-ui/react-checkbox": "^1.1.14",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "cmdk": "^1.0.0",
  "motion": "^11.15.0",
  "nanoid": "^5.0.0",
  "lucide-react": "^0.542.0"
}
```

---

## File Structure

```
your-app/
├── app/
│   └── api/
│       └── tables/
│           └── distinct/
│               └── route.ts        # API endpoint for filter options
├── components/
│   ├── filters/
│   │   ├── risk-filter.tsx        # Main filter component
│   │   ├── risk-filter.config.tsx # Filter configuration
│   │   ├── pnl-filter.config.tsx  # Alternative configuration
│   │   └── as-of-date-select.tsx  # Date selector component
│   └── ui/
│       ├── filters.tsx            # Filter chips UI
│       ├── command.tsx            # Command palette
│       ├── popover.tsx            # Popover component
│       ├── select.tsx             # Select component
│       ├── checkbox.tsx           # Checkbox component
│       ├── dropdown-menu.tsx      # Dropdown menu
│       ├── button.tsx             # Button component
│       └── scroll-area.tsx        # Scrollable area
├── lib/
│   ├── store/
│   │   └── filters.ts             # Global filter state
│   └── utils.ts                   # Utility functions
└── hooks/
    └── use-filters.ts             # Optional filter hooks
```

---

## Core Components

### 1. Filter Types

```typescript
// Filter data structure
interface Filter {
  id: string           // Unique identifier (nanoid)
  type: string         // Filter type key (e.g., "hmsDesk")
  operator: string     // Operator (e.g., "is", "is any of")
  value: string[]      // Selected values (array for multi-select)
  field?: string       // Database column name
}

// Filter option for dropdowns
interface FilterOption {
  name: string                    // Display name
  icon: React.ReactNode | undefined  // Optional icon
  label?: string                  // Optional secondary label
}

// Filter configuration
interface FilterConfig {
  filterTypes: Record<string, string>           // type -> column mapping
  filterOperators: Record<string, string>       // operator -> SQL mapping
  filterViewOptions: FilterOption[][]           // Grouped filter options
  filterViewToFilterOptions: Record<string, FilterOption[]>  // type -> options
}
```

### 2. Filter Operators

```typescript
export const FilterOperators = {
  // Equality operators
  IS: "is",
  IS_NOT: "is not",
  IS_ANY_OF: "is any of",

  // Text/pattern operators
  INCLUDE: "include",
  DO_NOT_INCLUDE: "do not include",
  INCLUDE_ALL_OF: "include all of",
  INCLUDE_ANY_OF: "include any of",
  EXCLUDE_ALL_OF: "exclude all of",
  EXCLUDE_IF_ANY_OF: "exclude if any of",

  // Date operators
  BEFORE: "before",
  AFTER: "after",
  BEFORE_AND_EQUAL: "before & equal",
  AFTER_AND_EQUAL: "after & equal"
}

// SQL operator mapping
const filterOperators = {
  "is": "=",
  "is not": "!=",
  "is any of": "IN",
  "include": "ILIKE",
  "do not include": "NOT ILIKE",
  "before": "<",
  "after": ">",
  "before & equal": "<=",
  "after & equal": ">=",
}
```

---

## State Management

### TanStack Store Implementation

Create `lib/store/filters.ts`:

```typescript
import { Store } from '@tanstack/react-store'

export interface Filter {
  id: string
  type: string
  operator: string
  value: string[]
  field?: string
}

export interface FiltersState {
  filters: Filter[]
  activeTable: string
  asOfDate: string | null
}

// Create the store
export const filtersStore = new Store<FiltersState>({
  filters: [],
  activeTable: '',
  asOfDate: null,
})

// Actions
export const filtersActions = {
  setFilters: (filters: Filter[]) => {
    filtersStore.setState((state) => ({
      ...state,
      filters,
    }))
  },

  addFilter: (filter: Filter) => {
    filtersStore.setState((state) => ({
      ...state,
      filters: [...state.filters, filter],
    }))
  },

  removeFilter: (filterId: string) => {
    filtersStore.setState((state) => ({
      ...state,
      filters: state.filters.filter(f => f.id !== filterId),
    }))
  },

  updateFilter: (filterId: string, updates: Partial<Filter>) => {
    filtersStore.setState((state) => ({
      ...state,
      filters: state.filters.map(f =>
        f.id === filterId ? { ...f, ...updates } : f
      ),
    }))
  },

  clearFilters: () => {
    filtersStore.setState((state) => ({
      ...state,
      filters: [],
    }))
  },

  setActiveTable: (tableName: string) => {
    filtersStore.setState((state) => ({
      ...state,
      activeTable: tableName,
    }))
  },

  setAsOfDate: (asOfDate: string | null) => {
    filtersStore.setState((state) => ({
      ...state,
      asOfDate,
    }))
  },
}

// Selectors
export const filtersSelectors = {
  getFilters: () => filtersStore.state.filters,
  getActiveFilters: () => filtersStore.state.filters.filter(f => f.value?.length > 0),
  getFiltersByType: (type: string) => filtersStore.state.filters.filter(f => f.type === type),
  getActiveTable: () => filtersStore.state.activeTable,
  getAsOfDate: () => filtersStore.state.asOfDate,
}
```

### Using the Store in Components

```typescript
import { useStore } from "@tanstack/react-store"
import { filtersStore, filtersActions } from "@/lib/store/filters"

function MyComponent() {
  // Subscribe to specific state
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)

  // Use actions to update state
  const handleAddFilter = () => {
    filtersActions.addFilter({
      id: nanoid(),
      type: "hmsDesk",
      operator: "is",
      value: ["Trading Desk A"],
      field: "hmsDesk",
    })
  }

  return (/* ... */)
}
```

---

## Filter Configuration

### Creating Filter Configurations

Create `components/filters/risk-filter.config.tsx`:

```typescript
import React from "react"
import {
  Building,
  BarChart3,
  PieChart,
  DollarSign,
  User,
  Clock,
  MapPin,
} from "lucide-react"

// Filter operators constants
export const FilterOperators = {
  IS: "is",
  IS_NOT: "is not",
  IS_ANY_OF: "is any of",
  INCLUDE: "include",
  DO_NOT_INCLUDE: "do not include",
  BEFORE: "before",
  AFTER: "after",
  BEFORE_AND_EQUAL: "before & equal",
  AFTER_AND_EQUAL: "after & equal"
}

export const riskFilterConfig = {
  // Filter types mapping to database columns
  filterTypes: {
    "hmsDesk": "hmsDesk",
    "hmsSL1": "hmsSL1",
    "hmsPortfolio": "hmsPortfolio",
    "collatCurrency": "collatCurrency",
    "counterParty": "counterParty",
    "tradeDate": "tradeDt",
  },

  // Filter operators for SQL generation
  filterOperators: {
    "is": "=",
    "is not": "!=",
    "is any of": "IN",
    "include": "ILIKE",
    "do not include": "NOT ILIKE",
    "before": "<",
    "after": ">",
    "before & equal": "<=",
    "after & equal": ">=",
  },

  // Icon mapping for filter types
  iconMapping: {
    "hmsDesk": <Building className="size-4 text-blue-500" />,
    "hmsSL1": <BarChart3 className="size-4 text-purple-500" />,
    "hmsPortfolio": <PieChart className="size-4 text-green-500" />,
    "collatCurrency": <DollarSign className="size-4 text-yellow-500" />,
    "counterParty": <User className="size-4 text-orange-500" />,
    "tradeDate": <Clock className="size-4 text-indigo-500" />,
  },

  // Operator configuration per field type
  operatorConfig: {
    "hmsDesk": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "hmsDesk",
    },
    "hmsSL1": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "hmsSL1",
    },
    "hmsPortfolio": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "hmsPortfolio",
    },
    "collatCurrency": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "collatCurrency",
    },
    "counterParty": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.INCLUDE, FilterOperators.DO_NOT_INCLUDE],
      type: "text",
      field: "counterParty",
    },
    "tradeDate": {
      operators: [FilterOperators.AFTER, FilterOperators.BEFORE, FilterOperators.BEFORE_AND_EQUAL, FilterOperators.AFTER_AND_EQUAL],
      type: "date",
      field: "tradeDate",
    },
  },

  // Preset date values
  dateValues: [
    "Today",
    "Yesterday",
    "This Week",
    "Last Week",
    "This Month",
    "Last Month",
    "This Quarter",
    "Last Quarter",
    "This Year",
    "Last Year",
  ],

  // Default table name
  tableName: "f_exposure",
}

// Export individual parts for flexibility
export const {
  filterTypes,
  filterOperators,
  iconMapping,
  operatorConfig,
  dateValues
} = riskFilterConfig
```

---

## API Integration

### Distinct Values API Endpoint

Create `app/api/tables/distinct/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')
    const columnName = searchParams.get('column')

    // Validate required parameters
    if (!tableName || !columnName) {
      return NextResponse.json(
        { error: 'Missing required parameters: table and column' },
        { status: 400 }
      )
    }

    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      )
    }

    // Validate column name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(columnName)) {
      return NextResponse.json(
        { error: 'Invalid column name' },
        { status: 400 }
      )
    }

    // Query your database for distinct values
    // Example with a generic database client:
    const query = `
      SELECT DISTINCT ${columnName} as value
      FROM ${tableName}
      WHERE ${columnName} IS NOT NULL
        AND ${columnName} != ''
      ORDER BY value
      LIMIT 1000
    `

    // Execute query with your database client
    // const rows = await db.query(query)

    // Mock response for example:
    const distinctValues = ["Value 1", "Value 2", "Value 3"]

    return NextResponse.json(distinctValues)

  } catch (error) {
    console.error('Error fetching distinct values:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Step-by-Step Implementation

### Step 1: Create AnimateChangeInHeight Component

This provides smooth height animations for the filter popover:

```typescript
// components/ui/filters.tsx (partial)
"use client"

import { useRef, useState, useEffect } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface AnimateChangeInHeightProps {
  children: React.ReactNode
  className?: string
}

export const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({
  children,
  className
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | "auto">("auto")

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const observedHeight = entries[0].contentRect.height
        setHeight(observedHeight)
      })

      resizeObserver.observe(containerRef.current)
      return () => resizeObserver.disconnect()
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
```

### Step 2: Create Filter Chips Display Component

```typescript
// components/ui/filters.tsx
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
import { type Dispatch, type SetStateAction, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "motion/react"

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

// Filter icon component
const FilterIcon = ({
  type,
  iconMapping,
}: {
  type: string
  iconMapping: Record<string, React.ReactNode>
}) => {
  return iconMapping[type] || <CircleDashed className="size-3.5" />
}

// Get available operators for a filter type
const getFilterOperators = ({
  filterType,
  filterValues,
  operatorConfig,
  dateValues,
}: {
  filterType: string
  filterValues: string[]
  operatorConfig: Record<string, any>
  dateValues: string[]
}): string[] => {
  const config = operatorConfig[filterType]
  if (!config) return []

  if (config.operators && Array.isArray(config.operators)) {
    return config.operators
  }

  return []
}

// Operator dropdown component
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
  operatorConfig: Record<string, any>
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
        {operators.map((op) => (
          <DropdownMenuItem key={op} onClick={() => setOperator(op)}>
            {op}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Value combobox for selecting filter values
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
          setTimeout(() => setCommandInput(""), 200)
        }
      }}
    >
      <PopoverTrigger className="rounded-none px-1.5 py-1 bg-muted hover:bg-muted/50 transition text-muted-foreground hover:text-primary shrink-0">
        <div className="flex gap-1.5 items-center">
          <div className="flex items-center flex-row -space-x-1.5">
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
              onInputCapture={(e) => setCommandInput(e.currentTarget.value)}
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
                      setTimeout(() => setCommandInput(""), 200)
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
                    {nonSelectedFilterValues.map((filter) => (
                      <CommandItem
                        className="group flex gap-2 items-center"
                        key={filter.name}
                        value={filter.name}
                        onSelect={(currentValue) => {
                          setFilterValues([...filterValues, currentValue])
                          setTimeout(() => setCommandInput(""), 200)
                          setOpen(false)
                        }}
                      >
                        <Checkbox checked={false} className="opacity-0 group-data-[selected=true]:opacity-100" />
                        {filter.icon}
                        <span className="text-accent-foreground">{filter.name}</span>
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

// Main Filters component
interface FiltersProps {
  filters: Filter[]
  setFilters: Dispatch<SetStateAction<Filter[]>>
  config: FilterConfig
  iconMapping: Record<string, React.ReactNode>
  dateValues: string[]
  operatorConfig: Record<string, any>
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
            {/* Filter type label */}
            <div className="flex gap-1.5 shrink-0 rounded-l bg-muted px-1.5 py-1 items-center">
              <FilterIcon type={filter.type} iconMapping={iconMapping} />
              {filter.type}
            </div>

            {/* Operator dropdown */}
            <FilterOperatorDropdown
              filterType={filter.type}
              operator={filter.operator}
              filterValues={filter.value}
              operatorConfig={operatorConfig}
              dateValues={dateValues}
              setOperator={(operator) => {
                setFilters((prev) => prev.map((f) =>
                  f.id === filter.id ? { ...f, operator } : f
                ))
              }}
            />

            {/* Value selector */}
            <FilterValueCombobox
              filterType={filter.type}
              filterValues={filter.value}
              filterViewToFilterOptions={config.filterViewToFilterOptions}
              iconMapping={iconMapping}
              setFilterValues={(filterValues) => {
                setFilters((prev) => prev.map((f) =>
                  f.id === filter.id ? { ...f, value: filterValues } : f
                ))
              }}
            />

            {/* Remove button */}
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

export { AnimateChangeInHeight }
```

### Step 3: Create Main RiskFilter Component

```typescript
// components/filters/risk-filter.tsx
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
import { ListFilter, Trash2, Loader2, AlertCircle } from "lucide-react"
import { nanoid } from "nanoid"
import * as React from "react"
import { useStore } from "@tanstack/react-store"
import { AnimateChangeInHeight } from "@/components/ui/filters"
import Filters, { type Filter, type FilterOption, type FilterConfig } from "@/components/ui/filters"
import { filtersStore, filtersActions } from "@/lib/store/filters"

interface RiskFilterProps {
  tableName?: string
  filterTypes?: Record<string, string>
  filterOperators?: Record<string, string>
  iconMapping?: Record<string, React.ReactNode>
  operatorConfig?: Record<string, any>
  dateValues?: string[]
}

export function RiskFilter({
  tableName = "f_exposure",
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

  // Subscribe to store
  const filters = useStore(filtersStore, (state) => state.filters)
  const activeTable = useStore(filtersStore, (state) => state.activeTable)

  const activeFilters = React.useMemo(() =>
    filters.filter(filter => filter.value?.length > 0),
    [filters]
  )

  // Set active table on mount
  React.useEffect(() => {
    if (tableName !== activeTable) {
      filtersActions.setActiveTable(tableName)
    }
  }, [tableName, activeTable])

  // Wrapper for setFilters
  const setFilters = React.useCallback((value: React.SetStateAction<Filter[]>) => {
    if (typeof value === 'function') {
      const newFilters = value(filters)
      filtersActions.setFilters(newFilters)
    } else {
      filtersActions.setFilters(value)
    }
  }, [filters])

  const [filterOptions, setFilterOptions] = React.useState<Record<string, FilterOption[]>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const filterTypeKeys = React.useMemo(() => Object.keys(filterTypes), [filterTypes])

  // Load filter options from API
  React.useEffect(() => {
    if (filterTypeKeys.length === 0) return

    const loadFilterOptions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const options: Record<string, FilterOption[]> = {}

        // Load all options in parallel
        const promises = Object.entries(filterTypes).map(async ([key, columnName]) => {
          const response = await fetch(`/api/tables/distinct?table=${tableName}&column=${columnName}`)

          if (!response.ok) {
            throw new Error(`Failed to fetch ${key} options`)
          }

          const values = await response.json()
          options[key] = Array.isArray(values) ? values.map((value: string) => ({
            name: value,
            icon: iconMapping[value] || iconMapping[key],
          })) : []
        })

        await Promise.all(promises)
        setFilterOptions(options)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load filter options')
      } finally {
        setIsLoading(false)
      }
    }

    loadFilterOptions()
  }, [tableName, filterTypes, iconMapping])

  // Filter configuration
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

    // Check if filter already exists
    const existingFilter = filters.find(f => f.type === filterType && f.field === field)

    if (existingFilter) {
      // Update existing filter
      const updatedValues = existingFilter.value.includes(filterValue)
        ? existingFilter.value
        : [...existingFilter.value, filterValue]

      filtersActions.updateFilter(existingFilter.id, { value: updatedValues })
    } else {
      // Create new filter
      filtersActions.addFilter({
        id: nanoid(),
        type: filterType,
        operator: defaultOperator,
        value: [filterValue],
        field,
      })
    }

    setTimeout(() => {
      setSelectedView(null)
      setCommandInput("")
    }, 200)
    setOpen(false)
  }

  if (Object.keys(filterTypes).length === 0) {
    return null
  }

  return (
    <div className="flex gap-5 flex-wrap items-center z-50">
      {/* Active filter chips */}
      <Filters
        filters={filters}
        setFilters={setFilters}
        config={filterConfig}
        iconMapping={iconMapping}
        dateValues={dateValues}
        operatorConfig={operatorConfig}
      />

      {/* Reset button */}
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

      {/* Add filter button */}
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
              "transition group h-8 text-sm items-center rounded-sm flex gap-1.5",
              filters.length > 0 && "w-8",
            )}
          >
            {isLoading ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : error ? (
              <AlertCircle className="size-4 shrink-0 text-destructive" />
            ) : (
              <ListFilter className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-all" />
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
                onInputCapture={(e) => setCommandInput(e.currentTarget.value)}
                ref={commandInputRef}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {selectedView ? (
                  // Show filter values for selected type
                  <CommandGroup>
                    {filterOptions[selectedView]?.map((filter) => (
                      <CommandItem
                        className="group text-muted-foreground flex gap-2 items-center"
                        key={filter.name}
                        value={filter.name}
                        onSelect={(currentValue) => handleAddFilter(selectedView, currentValue)}
                      >
                        {filter.icon}
                        <span className="text-accent-foreground">{filter.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  // Show filter types
                  <CommandGroup>
                    {filterTypeKeys.map((key) => (
                      <CommandItem
                        className="group text-muted-foreground flex gap-2 items-center"
                        key={key}
                        value={key}
                        onSelect={(currentValue) => {
                          setSelectedView(currentValue)
                          commandInputRef.current?.focus()
                        }}
                      >
                        {iconMapping[key]}
                        <span className="text-accent-foreground">{key}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </AnimateChangeInHeight>
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

### Step 4: Create AsOfDate Select Component

```typescript
// components/filters/as-of-date-select.tsx
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
import { ScrollArea } from "@/components/ui/scroll-area"

interface AsOfDateSelectProps {
  tableName?: string
  className?: string
}

export function AsOfDateSelect({
  tableName = "f_exposure",
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
        const response = await fetch(`/api/tables/distinct?table=${tableName}&column=asOfDate`)

        if (!response.ok) {
          throw new Error(`Failed to fetch dates: ${response.statusText}`)
        }

        const fetchedDates = await response.json()
        if (Array.isArray(fetchedDates)) {
          // Sort dates descending (latest first)
          const sortedDates = fetchedDates.sort((a, b) =>
            new Date(b).getTime() - new Date(a).getTime()
          )
          setDates(sortedDates)

          // Set latest date as default
          if (sortedDates.length > 0 && !asOfDate) {
            filtersActions.setAsOfDate(sortedDates[0])
          }
        }
      } catch (err) {
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
```

---

## Usage Examples

### Basic Usage

```tsx
import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"

export default function DataGridPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <RiskFilter
          tableName={riskFilterConfig.tableName}
          filterTypes={riskFilterConfig.filterTypes}
          filterOperators={riskFilterConfig.filterOperators}
          iconMapping={riskFilterConfig.iconMapping}
          operatorConfig={riskFilterConfig.operatorConfig}
          dateValues={riskFilterConfig.dateValues}
        />
      </div>

      {/* Your data grid component */}
    </div>
  )
}
```

### With AsOfDate Select

```tsx
import { RiskFilter } from "@/components/filters/risk-filter"
import { AsOfDateSelect } from "@/components/filters/as-of-date-select"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"

export default function DashboardPage() {
  return (
    <div className="flex items-center gap-4">
      <AsOfDateSelect tableName="f_exposure" />

      <RiskFilter
        tableName={riskFilterConfig.tableName}
        {...riskFilterConfig}
      />
    </div>
  )
}
```

### Consuming Filter State in Data Fetching

```tsx
import { useStore } from "@tanstack/react-store"
import { filtersStore, filtersSelectors } from "@/lib/store/filters"

function DataGrid() {
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)

  // Build query parameters from filters
  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams()

    if (asOfDate) {
      params.set('asOfDate', asOfDate)
    }

    filters.forEach(filter => {
      if (filter.value.length > 0) {
        params.set(`filter_${filter.field}`, JSON.stringify({
          operator: filter.operator,
          values: filter.value
        }))
      }
    })

    return params.toString()
  }, [filters, asOfDate])

  // Fetch data with filters
  const { data } = useQuery({
    queryKey: ['data', queryParams],
    queryFn: () => fetch(`/api/data?${queryParams}`).then(r => r.json())
  })

  return (/* ... */)
}
```

---

## Customization Guide

### Adding New Filter Types

1. Update the configuration file:

```typescript
// Add to filterTypes
filterTypes: {
  ...existingTypes,
  "newFilterType": "database_column_name",
}

// Add to iconMapping
iconMapping: {
  ...existingIcons,
  "newFilterType": <YourIcon className="size-4 text-color" />,
}

// Add to operatorConfig
operatorConfig: {
  ...existingConfig,
  "newFilterType": {
    operators: [FilterOperators.IS, FilterOperators.IS_NOT],
    type: "select", // or "text" or "date"
    field: "database_column_name",
  },
}
```

### Custom Filter Input Types

The system supports three input types:
- `select`: Dropdown with predefined options (fetched from API)
- `text`: Free text input with pattern matching
- `date`: Date picker with preset values

### Styling Customization

Override the default styles using Tailwind classes:

```tsx
<RiskFilter
  {...config}
  className="custom-filter-container"
/>
```

Filter chip styling is defined in `components/ui/filters.tsx`:

```css
/* Filter chip container */
.filter-chip {
  @apply flex gap-[1px] items-center text-xs;
}

/* Filter type label */
.filter-type-label {
  @apply flex gap-1.5 shrink-0 rounded-l bg-muted px-1.5 py-1 items-center;
}

/* Operator dropdown */
.filter-operator {
  @apply bg-muted hover:bg-muted/50 px-1.5 py-1 text-muted-foreground hover:text-primary transition shrink-0;
}
```

### Multiple Filter Configurations

Create separate config files for different use cases:

```typescript
// risk-filter.config.tsx - for risk data
// pnl-filter.config.tsx - for P&L data
// trades-filter.config.tsx - for trades data
```

Then use the appropriate config based on context:

```tsx
const filterConfig = useMemo(() => {
  switch (dataType) {
    case 'risk':
      return riskFilterConfig
    case 'pnl':
      return pnlFilterConfig
    default:
      return defaultFilterConfig
  }
}, [dataType])
```

---

## Troubleshooting

### Filter options not loading
- Check API endpoint is correctly configured
- Verify table and column names match database schema
- Check network tab for API response errors

### Filters not persisting
- The store is in-memory only; for persistence, add localStorage sync:

```typescript
// Add to filtersStore initialization
const savedFilters = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('filters') || '[]')
  : []

// Add effect to save on change
filtersStore.subscribe(() => {
  localStorage.setItem('filters', JSON.stringify(filtersStore.state.filters))
})
```

### Animation issues
- Ensure `motion` package is installed
- Check that `AnimateChangeInHeight` component is properly imported

### TypeScript errors
- Ensure all interface types are properly exported
- Check that `@types/react` is installed

---

## Summary

This filter system provides:

1. **Flexible configuration** - Per-table filter definitions
2. **Global state management** - Using TanStack Store
3. **Dynamic options loading** - From API endpoints
4. **Multiple input types** - Select, text, date
5. **Rich operator support** - Equality, pattern matching, date comparison
6. **Visual feedback** - Icons, animations, loading states
7. **Multi-select support** - Multiple values per filter
8. **Easy integration** - Drop-in component with configuration

The architecture separates concerns between configuration, state management, UI components, and API integration, making it easy to customize and extend for different use cases.
