"use client"

import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { AsOfDateSelect } from "@/components/filters/as-of-date-select"
export default function DataGridPage() {
  // Custom configuration for datagrid filters
  

  return (
       <div className="p-0">
      <div className="flex justify-between items-center mb-4">
         <h2 className="text-3xl font-bold tracking-tight">  Data Grid</h2>
    
        <div className="flex items-center gap-3">
          <RiskFilter
            tableName={riskFilterConfig.tableName}
            filterTypes={riskFilterConfig.filterTypes}
            filterOperators={riskFilterConfig.filterOperators}
            iconMapping={riskFilterConfig.iconMapping}
            operatorConfig={riskFilterConfig.operatorConfig}
            dateValues={riskFilterConfig.dateValues}
          />
          <AsOfDateSelect tableName={riskFilterConfig.tableName} />
        </div>
      </div>
      <div className="space-y-6">
      add
      </div>  

      
    </div>
  )
}