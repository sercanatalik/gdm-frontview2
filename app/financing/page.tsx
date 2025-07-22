
"use client"

import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { AsOfDateSelect } from "@/components/filters/as-of-date-select"
import { StatCards, defaultStatConfigs } from "@/components/stats/stat-cards"
import { HistoricalCashoutChart } from "@/components/charts/historical-cashout-chart"
import { RecentTradesCard } from "@/components/recent-trades-card"
import { useStore } from "@tanstack/react-store"
import { filtersStore } from "@/lib/store/filters"

export default function FinancingPage() {
  const filters = useStore(filtersStore, (state) => state.filters)
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate)

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-4">
         <h2 className="text-3xl font-bold tracking-tight">Financing Frontview</h2>
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
        {/* Stat Cards */}
        <StatCards 
          measures={defaultStatConfigs}
          relativeDt="-6m"
          asOfDate={asOfDate}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          filters={filters}
        />
        
        {/* Historical Cashout Chart - 5 columns of 8 on the left */}
        <div className="grid grid-cols-8 gap-6">
          <div className="col-span-5 space-y-6">
           
            <StatCards 
              measures={defaultStatConfigs}
              relativeDt="-6m"
              asOfDate={asOfDate}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
              filters={filters}
            />
             <HistoricalCashoutChart />
          </div>
          <div className="col-span-3">
            <RecentTradesCard filters={filters} />
          </div>
        </div>
        
        {/* Debug: Show active filters and asOfDate */}
        {(filters.length > 0 || asOfDate) && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Active State:</h3>
            <div className="text-sm space-y-2">
              {asOfDate && (
                <div>
                  <strong>As Of Date:</strong> {asOfDate}
                </div>
              )}
              {filters.length > 0 && (
                <div>
                  <strong>Filters:</strong>
                  <pre className="mt-1">{JSON.stringify(filters, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
