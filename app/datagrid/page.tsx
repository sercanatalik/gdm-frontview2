"use client"

import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { AsOfDateSelect } from "@/components/filters/as-of-date-select"
import { PerspectiveViewer } from "@/components/datagrid/perspective-viewer"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTableDesc } from "@/lib/query/table-desc"
import { useTableData } from "@/lib/query/table-data"
import { useStore } from "@tanstack/react-store"
import { filtersStore } from "@/lib/store/filters"
import "@/styles/perspective.css"

const tableConfig = [
  { name: "f_exposure", label: "Risk" ,filterable: true,asOfDate: true },

  { name: "f_trade", label: "Trades", filterable: false, asOfDate: true }
] 

export default function DataGridPage() {
  const [selectedTable, setSelectedTable] = useState<string>("f_exposure")

  // Get filters and asOfDate from store
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)

  // Get current table config
  const currentTableConfig = tableConfig.find(t => t.name === selectedTable)

  // Fetch table description
  const { data: tableDesc, isLoading: isLoadingDesc } = useTableDesc(selectedTable)

  // Fetch table data
  const { data: tableData, isLoading: isLoadingData } = useTableData({
    tableName: selectedTable,
    filters: filters,
    asOfDate: asOfDate || undefined,
    limit: 10000
  })

  // Use fetched data or empty array
  const data = tableData?.data || []

  return (
    <div className="p-0 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Data Grid</h2>

        <div className="flex items-center gap-3">
          {currentTableConfig?.filterable && (
            <RiskFilter
              tableName={selectedTable}
              filterTypes={riskFilterConfig.filterTypes}
              filterOperators={riskFilterConfig.filterOperators}
              iconMapping={riskFilterConfig.iconMapping}
              operatorConfig={riskFilterConfig.operatorConfig}
              dateValues={riskFilterConfig.dateValues}
            />
          )}
          {currentTableConfig?.asOfDate && (
            <AsOfDateSelect tableName={selectedTable} />
          )}
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="h-8 text-sm rounded-sm border-none bg-transparent hover:bg-accent hover:text-accent-foreground gap-1.5 px-3 w-auto min-w-[100px]">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tableConfig.map((table) => (
                <SelectItem key={table.name} value={table.name}>
                  {table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1">
        <div className="border rounded-lg p-4 bg-background w-full h-full">
          {isLoadingData ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading table data...</div>
            </div>
          ) : (
            <PerspectiveViewer
              data={data}
              theme="pro-dark"
              view="datagrid"
            />
          )}
        </div>
      </div>

    </div>
  )
}