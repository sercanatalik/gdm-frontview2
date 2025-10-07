'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JsonViewerProps {
  data: unknown;
  title?: string;
  maxHeight?: string;
}

export function JsonViewer({ data, title, maxHeight = 'h-[500px]' }: JsonViewerProps) {
  return (
    <Card className="h-full">
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className={`${maxHeight} w-full rounded-md border`}>
          <pre className="p-4 text-xs">
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
