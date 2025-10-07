'use client';
import { useStore } from '@tanstack/react-store';
import { toolOutputsStore } from '@/lib/store/tool-outputs';
import { useMemo } from 'react';
import { DynamicCharts } from './dynamic-charts';

interface QueryData {
  query: string;
  data: any[];
  timestamp: number;
  id: string;
}

export function AICharts() {
  const toolOutputs = useStore(toolOutputsStore, (state) => state.outputs);

  // Filter for run_select_query outputs and transform to array of dicts
  const queryData: QueryData[] = useMemo(() => {
    return toolOutputs
      .filter((output) => output.toolName === 'run_select_query')
      .map((output) => {
        const input = output.input as any;
        const outputData = output.output as any;
        const structuredContent = outputData?.structuredContent;

        // Convert columns/rows format to array of objects
        let transformedData: any[] = [];
        if (structuredContent?.columns && structuredContent?.rows) {
          const columns = structuredContent.columns;
          transformedData = structuredContent.rows.map((row: any[]) => {
            const obj: any = {};
            columns.forEach((col: string, index: number) => {
              obj[col] = row[index];
            });
            return obj;
          });
        } else if (Array.isArray(structuredContent)) {
          transformedData = structuredContent;
        }

        return {
          query: input?.query || '',
          data: transformedData,
          timestamp: output.timestamp,
          id: output.id,
        };
      });
  }, [toolOutputs]);

  if (queryData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-sm text-muted-foreground">
          Query results will appear here
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-4">
      {queryData.map((item) => (
        <DynamicCharts
          key={item.id}
          query={item.query}
          data={item.data}
          timestamp={item.timestamp}
        />
      ))}
    </div>
  );
}

