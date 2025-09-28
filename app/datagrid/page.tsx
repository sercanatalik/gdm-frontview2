"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColDef, ValueFormatterParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule,AllEnterpriseModule]);

import { AsOfDateSelect } from "@/components/filters/as-of-date-select";
import { RiskFilter } from "@/components/filters/risk-filter";
import { riskFilterConfig } from "@/components/filters/risk-filter.config";
import { Input } from "@/components/ui/input";
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

const TABLE_CONFIG = [
  { name: "f_exposure", label: "Risk", filterable: true, asOfDate: true },
  { name: "f_trade", label: "Trades", filterable: false, asOfDate: true },
] as const;

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

export default function DataGridPage() {
  const [selectedTable, setSelectedTable] = useState<string>("f_exposure");
  const [quickFilter, setQuickFilter] = useState("");

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

  const data = useMemo<ReadonlyArray<Record<string, unknown>>>(() => tableData?.data ?? [], [tableData]);
  const rowData = useMemo(() => data.map((row) => ({ ...row })), [data]);
  const rowCount = rowData.length;
  const columnDefs = useMemo<ColDef<Record<string, unknown>>[]>(
    () =>
      (tableDesc?.columns ?? []).map((column) => {
        const normalizedType = column.type?.toLowerCase() ?? "";
        const isStringType = normalizedType.includes("string");

        return {
          field: column.name,
          headerName: column.name,
          sortable: true,
          filter: true,
          resizable: true,
          valueFormatter: (params: ValueFormatterParams<Record<string, unknown>>) =>
            formatCellValue(params.value),
          enableRowGroup: isStringType || undefined,
        } satisfies ColDef<Record<string, unknown>>;
      }),
    [tableDesc]
  );

  const defaultColDef = useMemo<ColDef<Record<string, unknown>>>(
    () => ({
      flex: 1,
      minWidth: 160,
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const handleQuickFilterChange = useCallback(
    (value: string) => {
      setQuickFilter(value);
    },
    []
  );

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
        <div className="flex w-full max-w-sm items-center gap-2 md:ml-auto">
          <Input
            value={quickFilter}
            onChange={(event) => handleQuickFilterChange(event.target.value)}
            placeholder="Quick search..."
            className="h-8"
          />
        </div>
      </div>

      <div className="flex-1">
        <div className="flex h-full w-full flex-col rounded-lg border bg-background p-4">
          {isLoadingData ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground">Loading table data...</div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              No data available for the selected table.
            </div>
          ) : (
            <div className="flex h-full flex-1 flex-col">
              <div className="ag-theme-quartz flex-1" style={{ width: '100%', height: '100%' }}>
                <AgGridReact<Record<string, unknown>>
                  rowData={rowData}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  animateRows
                  rowGroupPanelShow="always"
                  sideBar="columns"
                  quickFilterText={quickFilter}
                />
              </div>
              <div className="pt-3 text-xs text-muted-foreground">
                Showing {rowCount.toLocaleString()} row{rowCount === 1 ? "" : "s"} • {columnDefs.length}
                {" "}
                column{columnDefs.length === 1 ? "" : "s"}.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}