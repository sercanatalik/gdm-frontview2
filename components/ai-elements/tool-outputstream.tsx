'use client';

import JsonView from '@uiw/react-json-view'


interface ToolOutput {
  toolName: string;
  output: unknown;
  input: unknown;
  state?: string;
}

interface ToolOutputStreamProps {
  toolOutputs: ToolOutput[];
}

export function ToolOutputStream({ toolOutputs }: ToolOutputStreamProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Tool Outputs</h3>
      <div className="space-y-4 overflow-y-auto max-h-[600px]">
        {toolOutputs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No tool outputs yet
          </div>
        ) : (
          toolOutputs.map((toolOutput, index) => (
            <div key={index} className="space-y-2">
              <div className="border rounded-md p-2">
                <h4 className="text-xs font-medium mb-2">{`${toolOutput.toolName} - Input (${index + 1})`}</h4>
                <div className="max-h-[200px] overflow-auto">
                  <JsonView value={toolOutput.input as object} />
                </div>
              </div>
              <div className="border rounded-md p-2">
                <h4 className="text-xs font-medium mb-2">{`${toolOutput.toolName} - Output (${index + 1})`}</h4>
                <div className="max-h-[500px] overflow-auto">
                  <JsonView value={toolOutput.output as object} collapsed  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
