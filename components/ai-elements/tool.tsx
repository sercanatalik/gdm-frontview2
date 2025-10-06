"use client";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn("not-prose mb-4 w-full rounded-md border", className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  title?: string;
  type: ToolUIPart["type"] | string;
  state: ToolUIPart["state"];
  className?: string;
};

const getStatusBadge = (status: ToolUIPart["state"]) => {
  const labels = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "output-available": "Completed",
    "output-error": "Error",
  } as const;

  const icons = {
    "input-streaming": <CircleIcon className="size-4" />,
    "input-available": <ClockIcon className="size-4 animate-pulse" />,
    "output-available": <CheckCircleIcon className="size-4 text-green-600" />,
    "output-error": <XCircleIcon className="size-4 text-red-600" />,
  } as const;

  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

const formatToolName = (type: string, title?: string): string => {
  if (title) return title;

  // Handle dynamic-tool
  if (type === 'dynamic-tool') return 'Tool Call';

  // Handle tool-{name} format
  if (type.startsWith('tool-')) {
    const name = type.replace('tool-', '');
    // Convert snake_case or kebab-case to Title Case
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return type;
};

export const ToolHeader = ({
  className,
  title,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      "flex w-full items-center justify-between gap-4 p-3",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">
        {formatToolName(type, title)}
      </span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn("space-y-2 overflow-hidden p-4", className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ToolUIPart["output"];
  errorText: ToolUIPart["errorText"];
};

// Generate a summary of the output
const generateSummary = (data: any): string => {
  if (!data) return "No output";

  if (typeof data === "string") {
    const lines = data.split('\n').length;
    const chars = data.length;
    return `String output: ${lines} line${lines !== 1 ? 's' : ''}, ${chars} character${chars !== 1 ? 's' : ''}`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return "Empty array";

    // Check if it's an array of objects with text property
    if (data[0] && typeof data[0] === 'object' && 'text' in data[0]) {
      try {
        const firstItem = JSON.parse(data[0].text);
        if (Array.isArray(firstItem)) {
          return `Found ${firstItem.length} item${firstItem.length !== 1 ? 's' : ''}`;
        }
      } catch {
        // Not JSON, continue
      }
    }

    return `Array with ${data.length} item${data.length !== 1 ? 's' : ''}`;
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);
    return `Object with ${keys.length} propert${keys.length !== 1 ? 'ies' : 'y'}: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`;
  }

  return `Output: ${String(data)}`;
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  // If output is an object with a 'content' property, use only the content
  let outputToDisplay = output;
  if (typeof output === "object" && output !== null && 'content' in output) {
    outputToDisplay = output.content;
  }

  // Generate summary
  const summary = generateSummary(outputToDisplay);

  let Output: ReactNode;

  if (isValidElement(outputToDisplay)) {
    // If it's already a React element, use it directly
    Output = outputToDisplay;
  } else if (typeof outputToDisplay === "object" && outputToDisplay !== null) {
    // If it's a plain object, stringify it
    Output = (
      <CodeBlock code={JSON.stringify(outputToDisplay, null, 2)} language="json" />
    );
  } else if (typeof outputToDisplay === "string") {
    // If it's a string, display it as code
    Output = <CodeBlock code={outputToDisplay} language="json" showLineNumbers />;
  } else {
    // Fallback for other types
    Output = <div>{String(outputToDisplay)}</div>;
  }

  return (
    <div className={cn("space-y-2 p-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {errorText ? "Error" : "Result"}
        </h4>
        <span className="text-muted-foreground text-xs italic">
          {summary}
        </span>
      </div>
      <div
        className={cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full",
          errorText
            ? "bg-destructive/10 text-destructive"
            : "bg-muted/50 text-foreground"
        )}
      >
        {errorText && <div>{errorText}</div>}
        {Output}
      </div>
    </div>
  );
};
