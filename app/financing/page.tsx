
"use client"

import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { StatCards, defaultStatConfigs } from "@/components/stats/stat-cards"
import { useStore } from "@tanstack/react-store"
import { filtersStore } from "@/lib/store/filters"

export default function FinancingPage() {
  const filters = useStore(filtersStore, (state) => state.filters)

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-4">
         <h2 className="text-3xl font-bold tracking-tight">Financing Frontview</h2>
        <RiskFilter
          tableName={riskFilterConfig.tableName}
          filterTypes={riskFilterConfig.filterTypes}
          filterOperators={riskFilterConfig.filterOperators}
          iconMapping={riskFilterConfig.iconMapping}
          operatorConfig={riskFilterConfig.operatorConfig}
          dateValues={riskFilterConfig.dateValues}
        />
      </div>
      
      <div className="space-y-6">
        {/* Stat Cards */}
        <StatCards 
          measures={defaultStatConfigs}
          relativeDt="-6m"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        />
        
   
        
        {/* Debug: Show active filters */}
        {filters.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Active Filters:</h3>
            <pre className="text-sm">{JSON.stringify(filters, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
