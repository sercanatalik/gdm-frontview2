# Dynamic Filter System — Recreation Guide

Complete instructions for building a data-model-agnostic, dynamic filter system in any Next.js + shadcn/ui project. This system provides a command-palette-style filter picker with multi-value selection, operator dropdowns, animated chips, and centralized state management.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        PAGE                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ FilterBar    │  │ AsOfDateSelect│  │ Reset Button     │  │
│  │ (RiskFilter) │  │               │  │                  │  │
│  └──────┬───────┘  └───────┬───────┘  └──────────────────┘  │
│         │                  │                                 │
│  ┌──────▼──────────────────▼───────────────────────────────┐ │
│  │              TanStack React Store                       │ │
│  │  { filters: Filter[], activeTable, asOfDate }           │ │
│  └──────┬──────────────────────────────────────────────────┘ │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────────┐ │
│  │          React Query Hooks / fetch()                    │ │
│  │  Passes filters[] to API as request body                │ │
│  └──────┬──────────────────────────────────────────────────┘ │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────────┐ │
│  │             API Routes (Next.js)                        │ │
│  │  buildFilterConditions() → SQL WHERE clause             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:** User selects filter → Store updates → Query hooks re-fire → API translates filters to SQL → Filtered data returned → UI re-renders.

---

## Prerequisites

### Dependencies

```bash
npm install @tanstack/react-store @tanstack/react-query nanoid motion lucide-react
```

### Required shadcn/ui Components

```bash
npx shadcn@latest add button command popover dropdown-menu checkbox select scroll-area
```

### Utility

Ensure you have the `cn()` utility (comes with shadcn/ui init):

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Step 1: Filter Store (State Management)

Create `lib/store/filters.ts`. This is the single source of truth for all filter state across the app.

```ts
import { Store } from '@tanstack/react-store'

export interface Filter {
  id: string
  type: string       // Display name / key (e.g. "status", "category")
  operator: string   // Human-readable operator (e.g. "is", "is not")
  value: string[]    // Selected values (always an array, even for single)
  field?: string     // Actual database column name (defaults to type if omitted)
}

export interface FiltersState {
  filters: Filter[]
  activeTable: string
  asOfDate: string | null
}

export const filtersStore = new Store<FiltersState>({
  filters: [],
  activeTable: '',
  asOfDate: null,
})

// Actions — mutate state immutably
export const filtersActions = {
  setFilters: (filters: Filter[]) => {
    filtersStore.setState((state) => ({ ...state, filters }))
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
    filtersStore.setState((state) => ({ ...state, filters: [] }))
  },
  setActiveTable: (tableName: string) => {
    filtersStore.setState((state) => ({ ...state, activeTable: tableName }))
  },
  setAsOfDate: (asOfDate: string | null) => {
    filtersStore.setState((state) => ({ ...state, asOfDate }))
  },
}

// Selectors — read state
export const filtersSelectors = {
  getFilters: () => filtersStore.state.filters,
  getActiveFilters: () => filtersStore.state.filters.filter(f => f.value?.length > 0),
  getFiltersByType: (type: string) => filtersStore.state.filters.filter(f => f.type === type),
  getActiveTable: () => filtersStore.state.activeTable,
  getAsOfDate: () => filtersStore.state.asOfDate,
}
```

**Why TanStack React Store?** It's tiny (~1KB), reactive, and doesn't require providers or context wrappers. Components subscribe with `useStore(filtersStore, selector)` and only re-render when their selected slice changes.

---

## Step 2: Filter Operators (Constants)

Create `lib/filter-operators.ts`. These are the human-readable operator labels and their SQL equivalents.

```ts
// Human-readable operator labels
export const FilterOperators = {
  IS: "is",
  IS_NOT: "is not",
  IS_ANY_OF: "is any of",
  INCLUDE: "include",
  DO_NOT_INCLUDE: "do not include",
  INCLUDE_ALL_OF: "include all of",
  INCLUDE_ANY_OF: "include any of",
  EXCLUDE_ALL_OF: "exclude all of",
  EXCLUDE_IF_ANY_OF: "exclude if any of",
  BEFORE: "before",
  AFTER: "after",
  BEFORE_AND_EQUAL: "before & equal",
  AFTER_AND_EQUAL: "after & equal",
} as const

// Maps human-readable operators → SQL operators (used on the backend)
export const operatorToSQL: Record<string, string> = {
  "is": "=",
  "is not": "!=",
  "is any of": "IN",
  "include": "ILIKE",
  "do not include": "NOT ILIKE",
  "include all of": "ILIKE",
  "include any of": "ILIKE",
  "exclude all of": "NOT ILIKE",
  "exclude if any of": "NOT ILIKE",
  "before": "<",
  "after": ">",
  "before & equal": "<=",
  "after & equal": ">=",
}
```

---

## Step 3: Filter Configuration (Per Data Model)

Create one config file per data source/table. This is the **only file that changes** when your data model changes.

### Config Type Definition

```ts
// lib/types/filter-config.ts
import { ReactNode } from "react"

export interface FilterFieldConfig {
  operators: string[]   // Which operators are available for this field
  type: "select" | "text" | "date"  // Determines UI behavior
  field: string         // Actual database column name
}

export interface FilterConfig {
  /** Map of display name → database column name */
  filterTypes: Record<string, string>

  /** Map of human operator → SQL operator */
  filterOperators: Record<string, string>

  /** Map of filter type key → icon JSX */
  iconMapping: Record<string, ReactNode>

  /** Per-field operator and type configuration */
  operatorConfig: Record<string, FilterFieldConfig>

  /** Predefined date value options for date-type filters */
  dateValues: string[]

  /** Default table/source name */
  tableName: string
}
```

### Example Config

```tsx
// components/filters/my-filter.config.tsx
import React from "react"
import { Building, User, Tag, Calendar, MapPin } from "lucide-react"
import { FilterOperators } from "@/lib/filter-operators"
import type { FilterConfig } from "@/lib/types/filter-config"

export const myFilterConfig: FilterConfig = {
  // Keys = display labels shown in the filter picker UI
  // Values = actual database column names used in queries
  filterTypes: {
    "department": "department",
    "owner": "owner_name",
    "status": "status",
    "region": "region",
    "created": "created_at",
  },

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

  // Each filter type gets a colored icon in the UI
  iconMapping: {
    "department": <Building className="size-4 text-blue-500" />,
    "owner": <User className="size-4 text-orange-500" />,
    "status": <Tag className="size-4 text-green-500" />,
    "region": <MapPin className="size-4 text-teal-500" />,
    "created": <Calendar className="size-4 text-gray-500" />,
  },

  // Per-field: which operators are valid, field type, DB column
  operatorConfig: {
    "department": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "department",
    },
    "owner": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.INCLUDE, FilterOperators.DO_NOT_INCLUDE],
      type: "text",     // "text" fields get include/exclude operators for partial matching
      field: "owner_name",
    },
    "status": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "status",
    },
    "region": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "region",
    },
    "created": {
      operators: [FilterOperators.AFTER, FilterOperators.BEFORE, FilterOperators.BEFORE_AND_EQUAL, FilterOperators.AFTER_AND_EQUAL],
      type: "date",
      field: "created_at",
    },
  },

  dateValues: [
    "Today", "Yesterday", "This Week", "Last Week",
    "This Month", "Last Month", "This Quarter", "Last Quarter",
    "This Year", "Last Year",
  ],

  tableName: "my_table",
}
```

**To add a new data model**, just create a new config file following this pattern. No component code changes needed.

---

## Step 4: Low-Level Filter Display Component

Create `components/ui/filters.tsx`. This renders active filters as interactive chip rows with operator dropdowns and value comboboxes.

### Types

```ts
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

export interface FilterUIConfig {
  filterTypes: Record<string, string>
  filterOperators: Record<string, string>
  filterViewOptions: FilterOption[][]
  filterViewToFilterOptions: Record<string, FilterOption[]>
}
```

### Sub-Components

The file contains these internal components:

1. **`AnimateChangeInHeight`** — Wraps popover content with ResizeObserver + Framer Motion for smooth height transitions when content changes.

2. **`FilterIcon`** — Renders the icon for a filter type from iconMapping, falls back to `CircleDashed`.

3. **`FilterOperatorDropdown`** — DropdownMenu showing available operators for a filter type. Uses `getFilterOperators()` which reads from `operatorConfig` to determine which operators apply based on field type and number of selected values.

4. **`FilterValueCombobox`** — Popover with Command palette for selecting/deselecting multiple values. Shows selected values with checkboxes at top, unselected below a separator. Includes animated icon stacking for selected values.

5. **`FilterValueDateCombobox`** — Simplified single-select combobox for date filters. Shows check marks instead of checkboxes.

6. **`Filters` (default export)** — Main component that renders a row of active filter chips, each composed of: `[icon + type label] [operator dropdown] [value combobox] [X remove button]`.

### Key Implementation Details

**Operator resolution logic** (`getFilterOperators`):
```ts
const getFilterOperators = ({ filterType, filterValues, operatorConfig, dateValues }) => {
  const config = operatorConfig[filterType]
  if (!config) return []
  // If operators array is defined directly, use it
  if (config.operators && Array.isArray(config.operators)) {
    return config.operators
  }
  // For DATE fields, use date-specific operators
  if (filterType.includes("DATE")) {
    if (filterValues?.some(v => dateValues.includes(v))) return config.past || []
    return config.date || []
  }
  // For multi-value, use multiple operators; single value uses single operators
  if (Array.isArray(filterValues) && filterValues.length > 1) {
    return config.multiple || []
  }
  return config.single || []
}
```

**Filter chip structure** (each active filter renders as):
```
┌────────────┬──────────┬─────────────────┬───┐
│ 📊 status  │ is       │ Active          │ ✕ │
│ (icon+type)│(operator)│(value combobox) │   │
└────────────┴──────────┴─────────────────┴───┘
```

All segments are visually joined with `gap-[1px]` and consistent `bg-muted` backgrounds. The first segment has `rounded-l`, the last has `rounded-r-sm`.

### Props Interface

```ts
interface FiltersProps {
  filters: Filter[]
  setFilters: Dispatch<SetStateAction<Filter[]>>
  config: FilterUIConfig
  iconMapping: Record<string, React.ReactNode>
  dateValues: string[]
  operatorConfig: Record<string, Record<string, string[]>>
}
```

### Full Source Reference

The complete implementation is in `components/ui/filters.tsx` (442 lines). Key dependencies:
- `motion/react` for `AnimatePresence`, `motion`
- shadcn/ui: `Button`, `Checkbox`, `Command*`, `DropdownMenu*`, `Popover*`
- lucide-react: `Check`, `CircleDashed`, `X`

---

## Step 5: Filter Bar Component (High-Level)

Create `components/filters/filter-bar.tsx`. This is the primary component pages use. It combines the filter picker popover with the active filter chips display.

### Responsibilities

1. Fetches available filter values from an API endpoint (distinct values per column)
2. Renders a "Filter" button that opens a command palette popover
3. Two-level navigation: first pick a filter type, then pick a value
4. Merges values into existing filters of the same type (no duplicates)
5. Renders active filters via the low-level `Filters` component
6. Provides a "Reset" button when filters are active

### Component Structure

```
FilterBar (main export)
├── Filters (low-level chip display)
├── Reset Button (conditional)
└── FilterPopover
    └── Command Palette
        ├── FilterTypeGroups (level 1: pick type)
        └── FilterValueList (level 2: pick value)
```

### Key Props

```ts
interface FilterBarProps {
  tableName?: string
  filterTypes?: Record<string, string>
  filterOperators?: Record<string, string>
  iconMapping?: Record<string, React.ReactNode>
  operatorConfig?: Record<string, any>
  dateValues?: string[]
}
```

### Filter Options Loading

On mount, the component loads distinct values for each filter type in parallel:

```ts
React.useEffect(() => {
  const loadFilterOptions = async () => {
    const promises = Object.entries(filterTypes).map(async ([key, columnName]) => {
      const response = await fetch(`/api/filters/distinct?table=${tableName}&column=${columnName}`)
      const values = await response.json()
      // Map to FilterOption[] with icon mapping applied
    })
    await Promise.all(promises)
  }
  loadFilterOptions()
}, [tableName, filterTypes])
```

### Adding a Filter

When a user selects a value from the command palette:

```ts
const handleAddFilter = (filterType: string, filterValue: string) => {
  const config = operatorConfig[filterType]
  const defaultOperator = config?.operators?.[0] || "is"
  const field = config?.field || filterType

  // Merge into existing filter of same type, or create new
  const existingFilter = filters.find(f => f.type === filterType && f.field === field)

  if (existingFilter) {
    const updatedValues = existingFilter.value.includes(filterValue)
      ? existingFilter.value
      : [...existingFilter.value, filterValue]
    filtersActions.updateFilter(existingFilter.id, { value: updatedValues })
  } else {
    filtersActions.addFilter({
      id: nanoid(),
      type: filterType,
      operator: defaultOperator,
      value: [filterValue],
      field,
    })
  }
}
```

### FilterPopover Sub-Component

Two-level command palette:
- **Level 1 (no `selectedView`)**: Shows filter types as selectable items with icons
- **Level 2 (`selectedView` set)**: Shows distinct values for that filter type

Uses `AnimateChangeInHeight` wrapper for smooth transitions between levels.

### FilterTypeGroups Sub-Component

Renders filter type options from `Object.keys(filterTypes)` with their icons. On select, sets `selectedView` to navigate to level 2.

---

## Step 6: Date Select Component (Optional)

Create `components/filters/date-select.tsx`. For data models with a date dimension (as-of-date, snapshot date, etc.).

### Behavior

1. Fetches distinct date values from the API
2. Sorts descending (latest first)
3. Auto-selects the latest date if none selected
4. Stores selection in `filtersStore.asOfDate`

### Props

```ts
interface DateSelectProps {
  tableName?: string    // Which table to query for dates
  className?: string
  dateColumn?: string   // Override the column name to query
}
```

### Implementation Notes

- Uses shadcn `Select` component with `ScrollArea` for long date lists
- Shows a `Calendar` icon from lucide-react
- Reads/writes via `filtersStore` and `filtersActions.setAsOfDate()`

---

## Step 7: API Endpoint — Distinct Values

Create `app/api/filters/distinct/route.ts`. Powers the filter option dropdowns.

```ts
// GET /api/filters/distinct?table=my_table&column=status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")
  const column = searchParams.get("column")

  // Validate table/column against allowlist to prevent SQL injection
  if (!isValidTable(table) || !isValidColumn(column)) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 })
  }

  // Query your database for distinct values
  const values = await db.query(
    `SELECT DISTINCT ${column} FROM ${table} WHERE ${column} IS NOT NULL ORDER BY ${column}`
  )

  return Response.json(values.map(row => row[column]))
}
```

**Security:** Always validate table and column names against an allowlist. Never interpolate raw user input into SQL.

---

## Step 8: API Filter Processing (Backend)

Add filter processing to your data-fetching API routes.

### buildFilterConditions()

This function converts the `Filter[]` array from the frontend into SQL WHERE clauses:

```ts
interface FilterCondition {
  type: string
  operator: string
  value: string[]
  field?: string
}

function buildFilterConditions(filters: FilterCondition[]): string {
  if (!filters || filters.length === 0) return ""

  const conditions = filters
    .filter(f => f.value?.length > 0)
    .map(filter => {
      const column = filter.field || filter.type
      const values = filter.value

      switch (filter.operator) {
        case "is":
          return values.length === 1
            ? `${column} = '${escape(values[0])}'`
            : `${column} IN (${values.map(v => `'${escape(v)}'`).join(", ")})`

        case "is not":
          return values.length === 1
            ? `${column} != '${escape(values[0])}'`
            : `${column} NOT IN (${values.map(v => `'${escape(v)}'`).join(", ")})`

        case "is any of":
          return `${column} IN (${values.map(v => `'${escape(v)}'`).join(", ")})`

        case "include":
          return `(${values.map(v => `${column} ILIKE '%${escape(v)}%'`).join(" OR ")})`

        case "do not include":
          return `(${values.map(v => `${column} NOT ILIKE '%${escape(v)}%'`).join(" AND ")})`

        case "include all of":
          return `(${values.map(v => `${column} ILIKE '%${escape(v)}%'`).join(" AND ")})`

        case "include any of":
          return `(${values.map(v => `${column} ILIKE '%${escape(v)}%'`).join(" OR ")})`

        case "exclude all of":
          return `(${values.map(v => `${column} NOT ILIKE '%${escape(v)}%'`).join(" AND ")})`

        case "exclude if any of":
          return `(${values.map(v => `${column} NOT ILIKE '%${escape(v)}%'`).join(" OR ")})`

        case "before":
          return `${column} < '${escape(values[0])}'`

        case "after":
          return `${column} > '${escape(values[0])}'`

        case "before & equal":
          return `${column} <= '${escape(values[0])}'`

        case "after & equal":
          return `${column} >= '${escape(values[0])}'`

        default:
          return null
      }
    })
    .filter(Boolean)

  return conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : ""
}
```

### Usage in API Route

```ts
// POST /api/data
export async function POST(request: Request) {
  const { tableName, filters, asOfDate, limit, offset, orderBy } = await request.json()

  const filterSQL = buildFilterConditions(filters || [])
  const dateCondition = asOfDate ? ` AND date_column = '${escape(asOfDate)}'` : ""

  const query = `
    SELECT * FROM ${tableName}
    WHERE 1=1${filterSQL}${dateCondition}
    ${orderBy ? `ORDER BY ${orderBy}` : ""}
    ${limit ? `LIMIT ${limit}` : ""}
    ${offset ? `OFFSET ${offset}` : ""}
  `

  const result = await db.query(query)
  return Response.json({ data: result })
}
```

---

## Step 9: React Query Hooks (Optional but Recommended)

Create `lib/query/filter-options.ts` for cached filter option loading:

```ts
import { useQuery } from '@tanstack/react-query'

export interface FilterOption {
  name: string
  icon?: React.ReactNode
}

const fetchFilterOptions = async (tableName: string, columnName: string): Promise<FilterOption[]> => {
  const response = await fetch(`/api/filters/distinct?table=${tableName}&column=${columnName}`)
  if (!response.ok) throw new Error(`Failed to fetch filter options: ${response.statusText}`)
  const values = await response.json()
  return Array.isArray(values) ? values.map((value: string) => ({ name: value, icon: undefined })) : []
}

export const useFilterOptions = (tableName: string, columnName: string) => {
  return useQuery({
    queryKey: ['filter-options', tableName, columnName],
    queryFn: () => fetchFilterOptions(tableName, columnName),
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
    enabled: Boolean(tableName && columnName),
  })
}

export const useMultipleFilterOptions = (tableName: string, filterTypes: Record<string, string>) => {
  const filterKeys = Object.keys(filterTypes)
  const queries = filterKeys.map(key => useFilterOptions(tableName, filterTypes[key]))
  return {
    queries,
    filterKeys,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  }
}
```

---

## Step 10: Page Integration

### Basic Usage

```tsx
"use client"
import { useStore } from "@tanstack/react-store"
import { filtersStore } from "@/lib/store/filters"
import { FilterBar } from "@/components/filters/filter-bar"
import { DateSelect } from "@/components/filters/date-select"
import { myFilterConfig } from "@/components/filters/my-filter.config"

export default function MyPage() {
  // Subscribe to filter state
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)

  // Pass filters to your data-fetching hooks
  const { data } = useMyData({ filters, asOfDate })

  return (
    <div>
      {/* Filter bar with config spread */}
      <div className="flex items-center gap-2">
        <FilterBar
          tableName={myFilterConfig.tableName}
          filterTypes={myFilterConfig.filterTypes}
          filterOperators={myFilterConfig.filterOperators}
          iconMapping={myFilterConfig.iconMapping}
          operatorConfig={myFilterConfig.operatorConfig}
          dateValues={myFilterConfig.dateValues}
        />
        <DateSelect tableName={myFilterConfig.tableName} />
      </div>

      {/* Your data display */}
      <DataTable data={data} />
    </div>
  )
}
```

### Spreading Config Shorthand

```tsx
<FilterBar {...myFilterConfig} />
```

### Multiple Data Models on One Page

```tsx
const [activeConfig, setActiveConfig] = useState(configA)

<Tabs onValueChange={(val) => setActiveConfig(val === "a" ? configA : configB)}>
  <TabsTrigger value="a">Dataset A</TabsTrigger>
  <TabsTrigger value="b">Dataset B</TabsTrigger>
</Tabs>
<FilterBar {...activeConfig} />
```

---

## File Structure Summary

```
lib/
  store/
    filters.ts              ← TanStack Store (state + actions + selectors)
  types/
    filter-config.ts        ← FilterConfig type definition
  filter-operators.ts       ← Operator constants + SQL mapping
  query/
    filter-options.ts       ← React Query hooks for loading filter values

components/
  ui/
    filters.tsx             ← Low-level filter chips display component
  filters/
    filter-bar.tsx          ← High-level filter bar (popover + chips + reset)
    date-select.tsx         ← Date dimension picker
    my-filter.config.tsx    ← Config for data model "my_table"
    other.config.tsx        ← Config for another data model (same structure)

app/
  api/
    filters/
      distinct/route.ts    ← GET distinct values for filter dropdowns
    data/route.ts           ← POST data with filter processing
```

---

## Adding a New Data Model (Checklist)

1. **Create a new config file** (`components/filters/new-model.config.tsx`):
   - Define `filterTypes` — map display name → DB column
   - Define `iconMapping` — map display name → lucide icon
   - Define `operatorConfig` — map display name → available operators + field type
   - Set `tableName`

2. **Add table to API allowlist** (if using table validation)

3. **Use in page**: `<FilterBar {...newModelConfig} />`

No changes needed to store, components, or API filter processing logic.

---

## Operator Quick Reference

| Operator | SQL | Use Case | Value Handling |
|---|---|---|---|
| `is` | `=` / `IN` | Exact match | Single → `=`, Multi → `IN` |
| `is not` | `!=` / `NOT IN` | Exclude exact | Single → `!=`, Multi → `NOT IN` |
| `is any of` | `IN` | Multiple exact | Always `IN` |
| `include` | `ILIKE '%v%'` | Text search (any match) | Values joined with `OR` |
| `do not include` | `NOT ILIKE '%v%'` | Text exclude (all must not match) | Values joined with `AND` |
| `include all of` | `ILIKE '%v%'` | Text search (all must match) | Values joined with `AND` |
| `include any of` | `ILIKE '%v%'` | Text search (any match) | Values joined with `OR` |
| `exclude all of` | `NOT ILIKE '%v%'` | Text exclude (all must not match) | Values joined with `AND` |
| `exclude if any of` | `NOT ILIKE '%v%'` | Text exclude (any must not match) | Values joined with `OR` |
| `before` | `<` | Date comparison | Single value |
| `after` | `>` | Date comparison | Single value |
| `before & equal` | `<=` | Date comparison | Single value |
| `after & equal` | `>=` | Date comparison | Single value |

---

## Key Design Decisions

1. **Config-driven, not code-driven**: Adding filters for a new data model requires only a config file — zero component changes.

2. **Store-first state**: All filter state lives in TanStack Store, not URL params or local state. Any component anywhere in the tree can read/write filters.

3. **Type → Field separation**: `type` is the display label; `field` is the DB column. This allows human-readable labels without coupling to database schema.

4. **Merge-on-add**: Selecting a value for an already-active filter type merges it into the existing filter rather than creating a duplicate.

5. **Operator-per-field**: Each field declares which operators it supports. Date fields get date operators, text fields get include/exclude, select fields get is/is not.

6. **Parallel option loading**: All filter option dropdowns load their distinct values concurrently via `Promise.all`.

7. **Animation**: `AnimateChangeInHeight` using ResizeObserver + Framer Motion ensures the popover resizes smoothly as the user navigates between filter type selection and value selection.
