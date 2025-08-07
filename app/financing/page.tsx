
"use client"

import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { AsOfDateSelect } from "@/components/filters/as-of-date-select"
import { StatCards, defaultStatConfigs } from "@/components/stats/stat-cards"
import { GroupedStatCard } from "@/components/stats/grouped-stat-card"
import { HistoricalCashoutChart } from "@/components/charts/historical-cashout-chart"
import { RecentTradesCard } from "@/components/recent-trades-card"
import { useStore } from "@tanstack/react-store"
import { filtersStore } from "@/lib/store/filters"
import { formatters } from "@/lib/query/stats"

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

        {/* Grouped Stats Cards */}
       
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
            <RecentTradesCard filters={filters} asOfDate={asOfDate ?? undefined} />
          </div>
        </div>
        
       

        {/* Grouped Stats Cards - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-3">
          <GroupedStatCard
            measure={{
              key: 'desk_analysis',
              label: 'By Desk',
              field: 'cashOut',
              tableName: 'risk_f_mv',
              aggregation: 'sum',
              formatter: formatters.currency,
              result1: { field: 'counterparty', aggregation: 'countDistinct' },
              result2: { field: 'underlyingAmount', aggregation: 'sum' },
              limit: 12
            }}
            groupBy="desk"
            relativeDt="-1d"
            asOfDate={asOfDate}
            filters={filters}
          />

          <GroupedStatCard
            measure={{
              key: 'sl1_analysis',
              label: 'By SL1',
              field: 'cashOut',
              tableName: 'risk_f_mv',
              aggregation: 'sum',
              formatter: formatters.currency,
              result1: { field: 'counterparty', aggregation: 'countDistinct' },
              result2: { field: 'underlyingAmount', aggregation: 'sum' },
              limit: 12
            }}
            groupBy="SL1"
            relativeDt="-1d"
            asOfDate={asOfDate}
            filters={filters}
          />

          <GroupedStatCard
            measure={{
              key: 'ccy_analysis',
              label: 'By Currency',
              field: 'cashOut',
              tableName: 'risk_f_mv',
              aggregation: 'sum',
              formatter: formatters.currency,
              result1: { field: 'counterparty', aggregation: 'countDistinct' },
              result2: { field: 'underlyingAmount', aggregation: 'sum' },
              limit: 12
            }}
            groupBy="ccy"
            relativeDt="-1d"
            asOfDate={asOfDate}
            filters={filters}
          />

          <GroupedStatCard
            measure={{
              key: 'counterparty_analysis',
              label: 'By Counterparty',
              field: 'cashOut',
              tableName: 'risk_f_mv',
              aggregation: 'sum',
              formatter: formatters.currency,
              result1: { field: 'book', aggregation: 'countDistinct' },
              result2: { field: 'underlyingAmount', aggregation: 'sum' },
              limit: 12
            }}
            groupBy="counterparty"
            relativeDt="-1d"
            asOfDate={asOfDate}
            filters={filters}
          />

        </div>

        {/* Grouped Stats Cards - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-3">
          <GroupedStatCard
            measure={{
              key: 'obligor_analysis',
              label: 'By Obligor',
              field: 'cashOut',
              tableName: 'risk_f_mv',
              aggregation: 'sum',
              formatter: formatters.currency,
              result1: { field: 'counterparty', aggregation: 'countDistinct' },
              result2: { field: 'underlyingAmount', aggregation: 'sum' },
              limit: 12
            }}
            groupBy="obligor"
            relativeDt="-1d"
            asOfDate={asOfDate}
            filters={filters}
          />

          <GroupedStatCard
            measure={{
              key: 'collat_rating_analysis',
              label: 'By Collat Rating',
              field: 'cashOut',
              tableName: 'risk_f_mv',
              aggregation: 'sum',
              formatter: formatters.currency,
              result1: { field: 'counterparty', aggregation: 'countDistinct' },
              result2: { field: 'underlyingAmount', aggregation: 'sum' },
              limit: 12
            }}
            groupBy="collatRating"
            relativeDt="-1d"
            asOfDate={asOfDate}
            filters={filters}
          />

          <GroupedStatCard
            measure={{
              key: 'collat_sector_analysis',
              label: 'By Collat Sector',
              field: 'cashOut',
              tableName: 'risk_f_mv',
              aggregation: 'sum',
              formatter: formatters.currency,
              result1: { field: 'counterparty', aggregation: 'countDistinct' },
              result2: { field: 'underlyingAmount', aggregation: 'sum' },
              limit: 12
            }}
            groupBy="collatSector"
            relativeDt="-1d"
            asOfDate={asOfDate}
            filters={filters}
          />

          <GroupedStatCard
            measure={{
              key: 'collat_industry_analysis',
              label: 'By Collat Industry',
              field: 'cashOut',
              tableName: 'risk_f_mv',
              aggregation: 'sum',
              formatter: formatters.currency,
              result1: { field: 'counterparty', aggregation: 'countDistinct' },
              result2: { field: 'underlyingAmount', aggregation: 'sum' },
              limit: 12
            }}
            groupBy="collatIndustry"
            relativeDt="-1d"
            asOfDate={asOfDate}
            filters={filters}
          />
        </div>
      </div>
    </div>
  )
}
