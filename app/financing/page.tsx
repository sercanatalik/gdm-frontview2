
"use client"

import { useState } from "react"
import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { type Filter } from "@/components/ui/filters"

export default function FinancingPage() {
  const [filters, setFilters] = useState<Filter[]>([])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financing</h1>
        <RiskFilter
          filters={filters}
          setFilters={setFilters}
          tableName={riskFilterConfig.tableName}
          filterTypes={riskFilterConfig.filterTypes}
          filterOperators={riskFilterConfig.filterOperators}
          iconMapping={riskFilterConfig.iconMapping}
          operatorConfig={riskFilterConfig.operatorConfig}
          dateValues={riskFilterConfig.dateValues}
        />
      </div>
      
      <div className="space-y-4">
        <p>Financing content here</p>
        
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
