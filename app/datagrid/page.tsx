"use client";

import { useMemo, useState } from "react";

import { AsOfDateSelect } from "@/components/filters/as-of-date-select";
import { RiskFilter } from "@/components/filters/risk-filter";
import { riskFilterConfig } from "@/components/filters/risk-filter.config";
import { PerspectiveViewer } from "@/components/datagrid/perspective-viewer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableDesc } from "@/lib/query/table-desc";
import { useTableData } from "@/lib/query/table-data";
import { filtersStore } from "@/lib/store/filters";
import { useStore } from "@tanstack/react-store";
import "@/styles/perspective.css";

const TABLE_CONFIG = [
  { name: "f_exposure", label: "Risk", filterable: true, asOfDate: true },
  { name: "f_trade", label: "Trades", filterable: false, asOfDate: true },
] as const;

export default function DataGridPage() {
  const [selectedTable, setSelectedTable] = useState<string>("f_exposure");

  const filters = useStore(filtersStore, (state) => state.filters);
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate);

  const currentTableConfig = useMemo(
    () => TABLE_CONFIG.find((table) => table.name === selectedTable),
    [selectedTable]
  );

  const { data: tableDesc, isLoading: isLoadingDesc } = useTableDesc(
    currentTableConfig?.name
  );

  const { data: tableData, isLoading: isLoadingData } = useTableData({
    tableName: selectedTable,
    filters,
    asOfDate: asOfDate || undefined,
    limit: 10000,
  });

  const data = useMemo(() => tableData?.data ?? [], [tableData]);
  const rowCount = data.length;

  return (
    <div className="flex h-screen flex-col p-0">
      <div className="mb-4 flex items-center justify-between">
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
            <SelectTrigger className="min-w-[100px] gap-1.5 rounded-sm border-none bg-transparent px-3 text-sm hover:bg-accent hover:text-accent-foreground">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {TABLE_CONFIG.map((table) => (
                <SelectItem key={table.name} value={table.name}>
                  {table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Showing {rowCount.toLocaleString()} row{rowCount === 1 ? "" : "s"}
        </span>
        <span>
          {isLoadingDesc
            ? "Loading table details..."
            : tableDesc
            ? `${tableDesc.meta.columnCount} columns`
            : ""}
        </span>
      </div>

      <div className="flex-1">
        <div className="h-full w-full rounded-lg border bg-background p-4">
          {isLoadingData ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">Loading table data...</div>
            </div>
          ) : (
            <PerspectiveViewer data={data} theme="pro-dark" view="datagrid" />
          )}
        </div>
      </div>
    </div>
  );
}