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