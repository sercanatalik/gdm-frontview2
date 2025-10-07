'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Code, Database, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DynamicChartsProps {
  query: string;
  data: any[];
  timestamp: number;
}

export function DynamicCharts({ query, data, timestamp }: DynamicChartsProps) {
  const [showQuery, setShowQuery] = useState(false);
  const [showData, setShowData] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate chart loading/processing
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, query]);

  const handleCopy = async () => {
    const content = JSON.stringify({ query, data }, null, 2);
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      {/* Header with Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Query Result</div>
          <div className="text-xs text-muted-foreground">
            {data.length} rows
          </div>
        </div>

        {/* Compact Toolbar */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => setShowQuery(!showQuery)}
          >
            <Code className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Query</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => setShowData(!showData)}
          >
            <Database className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Data</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>

          <div className="text-xs text-muted-foreground ml-2">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* SQL Query - Collapsible */}
      {showQuery && (
        <div className="px-4 py-3 border-b bg-muted/10">
          <div className="text-xs font-medium text-muted-foreground mb-2">SQL Query:</div>
          <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
            {query}
          </pre>
        </div>
      )}

      {/* Chart Area */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Generating chart...
              </div>
              <div className="text-xs text-muted-foreground">
                Processing {data.length} rows
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Chart will render here
              </div>
              <div className="text-xs text-muted-foreground">
                Dynamic visualization based on query results
              </div>
            </div>
          </div>
        )}</div>

      {/* Raw Data - Collapsible */}
      {showData && (
        <div className="px-4 py-3 border-t bg-muted/10">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Raw Data ({data.length} rows):
          </div>
          <div className="bg-muted/50 p-3 rounded overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
