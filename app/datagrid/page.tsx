"use client";

import { useMemo, useState } from "react";

import { AsOfDateSelect } from "@/components/filters/as-of-date-select";
import { RiskFilter } from "@/components/filters/risk-filter";
import { riskFilterConfig } from "@/components/filters/risk-filter.config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTableDesc } from "@/lib/query/table-desc";
import { useTableData } from "@/lib/query/table-data";
import { filtersStore } from "@/lib/store/filters";
import { useStore } from "@tanstack/react-store";

const TABLE_CONFIG = [
  { name: "f_exposure", label: "Risk", filterable: true, asOfDate: true },
  { name: "f_trade", label: "Trades", filterable: false, asOfDate: true },
] as const;

const MAX_VISIBLE_ROWS = 100;

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
  const rowCount = data.length;
  const columns = useMemo(() => tableDesc?.columns.map((column) => column.name) ?? [], [tableDesc]);
  const visibleRows = useMemo(() => data.slice(0, MAX_VISIBLE_ROWS), [data]);

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
            <>
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.map((row, index) => (
                      <TableRow key={`${rowCount}-${index}`}>
                        {columns.map((column) => (
                          <TableCell key={`${column}-${index}`} className="whitespace-nowrap text-xs">
                            {formatCellValue(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="pt-3 text-xs text-muted-foreground">
                Showing {visibleRows.length.toLocaleString()} of {rowCount.toLocaleString()} rows.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}