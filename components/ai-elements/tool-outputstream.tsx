'use client';

import JsonView from '@uiw/react-json-view'
import { useStore } from '@tanstack/react-store'
import { toolOutputsStore } from '@/lib/store/tool-outputs'

export function ToolOutputStream() {
  const toolOutputs = useStore(toolOutputsStore, (state) => state.outputs)
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Tool Outputs</h3>
      <div className="space-y-4 overflow-y-auto max-h-[600px]">
        {toolOutputs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No tool outputs yet
          </div>
        ) : (
          toolOutputs.map((toolOutput) => (
            <div key={toolOutput.id} className="space-y-2">
              <div className="border rounded-md p-2">
                <h4 className="text-xs font-medium mb-2">{`${toolOutput.id} `}</h4>
                <div className="max-h-[200px] overflow-auto">
                  <JsonView value={toolOutput as object} />
                </div>
              </div>
             
            </div>
          ))
        )}
      </div>
    </div>
  );
}
