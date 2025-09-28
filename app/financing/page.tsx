"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { PerspectiveViewer } from "@/components/datagrid/perspective-viewer";
import { CashoutChart } from "@/components/charts/cashout-chart";
import { AsOfDateSelect } from "@/components/filters/as-of-date-select";
import { RiskFilter } from "@/components/filters/risk-filter";
import { riskFilterConfig } from "@/components/filters/risk-filter.config";
import { RecentTradesCard } from "@/components/recent-trades-card";
import { GroupedStatCard } from "@/components/stats/grouped-stat-card";
import { StatCards, defaultStatConfigs } from "@/components/stats/stat-cards";
import { useStore } from "@tanstack/react-store";
import { filtersStore } from "@/lib/store/filters";
import { formatters } from "@/lib/query/stats";
import { useTableData } from "@/lib/query/table-data";
import "@/styles/perspective.css";

const LAZY_LOAD_DELAY = 1500;

const GROUPED_CARD_BASE_MEASURE = {
  field: "fundingAmount",
  tableName: "f_exposure",
  aggregation: "sum",
  formatter: formatters.currency,
  result1: { field: "counterParty", aggregation: "countDistinct" },
  result2: { field: "collateralAmount", aggregation: "sum" },
} as const;

type GroupedCardConfig = {
  id: string;
  label: string;
  groupBy: string;
  limit?: number;
};

const PRIMARY_GROUPED_CARD_CONFIGS: GroupedCardConfig[] = [
  { id: "desk", label: "By Desk", groupBy: "hmsDesk" },
  { id: "sl1", label: "By Ccy", groupBy: "hmsSL1" },
  { id: "location", label: "By Ccy", groupBy: "tradingLocation" },
  { id: "collateral", label: "By Ccy", groupBy: "collatCurrency" },
];

const LAZY_GROUPED_CARD_CONFIGS: GroupedCardConfig[] = [
  { id: "portfolio", label: "By Portfolio", groupBy: "hmsPortfolio", limit: 8 },
  { id: "counterparty", label: "By Counterparty", groupBy: "counterParty", limit: 10 },
];

const buildGroupedMeasure = (config: GroupedCardConfig) => ({
  key: `desk_analysis_${config.id}`,
  label: config.label,
  ...GROUPED_CARD_BASE_MEASURE,
  limit: config.limit ?? 12,
});

export default function FinancingPage() {
  const filters = useStore(filtersStore, (state) => state.filters);
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate);

  const [showLazyContent, setShowLazyContent] = useState(false);
  const [isLoadingLazy, setIsLoadingLazy] = useState(false);
  const lazyTriggerRef = useRef<HTMLDivElement>(null);

  const { data: tableData, isLoading: isLoadingTableData } = useTableData(
    showLazyContent
      ? {
          tableName: "f_exposure",
          filters,
          asOfDate: asOfDate || undefined,
          limit: 20000,
        }
      : null
  );

  const perspectiveData = useMemo(() => tableData?.data ?? [], [tableData]);

  useEffect(() => {
    if (showLazyContent) {
      return;
    }

    let timeoutId: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingLazy) {
          setIsLoadingLazy(true);
          timeoutId = window.setTimeout(() => {
            setShowLazyContent(true);
            setIsLoadingLazy(false);
          }, LAZY_LOAD_DELAY);
        }
      },
      {
        rootMargin: "100px",
      }
    );

    const trigger = lazyTriggerRef.current;
    if (trigger) {
      observer.observe(trigger);
    }

    return () => {
      observer.disconnect();
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isLoadingLazy, showLazyContent]);

  return (
    <div className="p-0">
      <div className="mb-4 flex items-center justify-between">
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
        <StatCards
          measures={defaultStatConfigs}
          relativeDt="-6m"
          asOfDate={asOfDate}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
          filters={filters}
        />

        <div className="grid grid-cols-8 gap-6">
          <div className="col-span-5 space-y-6">
            <CashoutChart />
          </div>
          <div className="col-span-3">
            <RecentTradesCard filters={filters} asOfDate={asOfDate ?? undefined} />
          </div>
        </div>

        <div className="my-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PRIMARY_GROUPED_CARD_CONFIGS.map((config) => (
            <GroupedStatCard
              key={config.id}
              measure={buildGroupedMeasure(config)}
              groupBy={config.groupBy}
              relativeDt="-1d"
              asOfDate={asOfDate}
              filters={filters}
            />
          ))}
        </div>

        <div ref={lazyTriggerRef} className="h-10" />

        {isLoadingLazy && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Loading additional content...
              </span>
            </div>
          </div>
        )}

        {showLazyContent && (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            {/* <div className="grid grid-cols-1 gap-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Performance Analysis</h3>
                <PerformanceCard asOfDate={asOfDate ?? undefined} filters={filters} />
              </div>
            </div> */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {LAZY_GROUPED_CARD_CONFIGS.map((config) => (
                <GroupedStatCard
                  key={config.id}
                  measure={buildGroupedMeasure(config)}
                  groupBy={config.groupBy}
                  relativeDt="-1d"
                  asOfDate={asOfDate}
                  filters={filters}
                />
              ))}
              <div className="rounded-lg border border-border bg-card p-6">
                <h4 className="mb-3 text-base font-medium">Quick Insights</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Data loaded dynamically when scrolled into view</p>
                  <p>• Performance optimized with lazy loading</p>
                  <p>• Additional analytics and reports available</p>
                  <p>• Real-time updates with filter synchronization</p>
                </div>
              </div>
            </div>

            <div className="col-span-full rounded-lg border border-border bg-card">
              <div className="border-b border-border p-4">
                <h4 className="text-base font-medium">Exposure Data Grid</h4>
                <div className="mt-1 text-xs text-muted-foreground">
                  {isLoadingTableData ? (
                    <span>Loading data...</span>
                  ) : (
                    <span>
                      {perspectiveData.length.toLocaleString()} records from f_exposure
                      table • Filters and asOfDate applied
                    </span>
                  )}
                </div>
              </div>
              <div className="relative h-[1000px]">
                {isLoadingTableData ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Loading table data...
                      </span>
                    </div>
                  </div>
                ) : perspectiveData.length > 0 ? (
                  <PerspectiveViewer
                    data={perspectiveData}
                    theme="pro-dark"
                    view="datagrid"
                    className="h-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">No data available</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Try adjusting your filters or date selection
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
