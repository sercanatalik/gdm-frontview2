'use client';

import JsonView from '@uiw/react-json-view'
import { useStore } from '@tanstack/react-store'
import { toolOutputsStore } from '@/lib/store/tool-outputs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Code2, Database } from 'lucide-react'

interface ToolOutputStreamProps {
  variant?: 'input' | 'output' | 'both'
}

export function ToolOutputStream({ variant = 'both' }: ToolOutputStreamProps) {
  const toolOutputs = useStore(toolOutputsStore, (state) => state.outputs)

  if (toolOutputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="rounded-full bg-muted p-3 mb-3">
          {variant === 'input' ? (
            <Code2 className="h-6 w-6 text-muted-foreground" />
          ) : (
            <Database className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {variant === 'input' ? 'No tool inputs yet' : 'No tool outputs yet'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a conversation to see results
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {toolOutputs.map((toolOutput) => (
          <div
            key={toolOutput.id}
            className="rounded-lg border bg-background p-3 hover:shadow-sm transition-shadow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  {toolOutput.toolName}
                </Badge>
                {toolOutput.state && (
                  <Badge variant="secondary" className="text-xs">
                    {toolOutput.state}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(toolOutput.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Content */}
            {(variant === 'input' || variant === 'both') && (
              <div className="space-y-2">
                {variant === 'both' && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Code2 className="h-3 w-3" />
                    Input
                  </div>
                )}
                <div className="rounded-md bg-muted/50 p-2 overflow-auto max-h-[200px]">
                  <JsonView
                    value={toolOutput.input as object}
                    collapsed={variant === 'both' ? 1 : false}
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
            )}

            {(variant === 'output' || variant === 'both') && (
              <div className="space-y-2 mt-3">
                {variant === 'both' && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Database className="h-3 w-3" />
                    Output
                  </div>
                )}
                <div className="rounded-md bg-muted/50 p-2 overflow-auto max-h-[300px]">
                  <JsonView
                    value={toolOutput.output as object}
                    collapsed={1}
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
