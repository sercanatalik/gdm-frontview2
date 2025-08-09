import { NextResponse } from 'next/server';
import { experimental_createMCPClient } from 'ai';

export async function GET() {
  try {
    let tools: Record<string, any> = {};
    let mcpClient: any = null;

    // Try to connect to MCP server
    try {
      const serverUrl = 'http://127.0.0.1:9001/sse/';
      
      mcpClient = await experimental_createMCPClient({
        transport: {
          type: 'sse',
          url: serverUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        },
      });

      const resolvedClient = await mcpClient;
      tools = await resolvedClient.tools();
      console.log('MCP tools retrieved:', Object.keys(tools));
    } catch (mcpError) {
      console.warn('MCP server connection failed:', mcpError);
      return NextResponse.json({
        availableTools: [],
        error: 'MCP server not available',
      });
    } finally {
      // Close MCP client if it was created
      if (mcpClient) {
        try {
          const resolvedClient = await mcpClient;
          await resolvedClient.close();
        } catch (closeError) {
          console.warn('Failed to close MCP client:', closeError);
        }
      }
    }

    return NextResponse.json({
      availableTools: Object.keys(tools),
      tools: Object.fromEntries(
        Object.entries(tools).map(([name, config]) => [
          name,
          {
            name,
            description: (config as any)?.description || `MCP tool: ${name}`,
            inputSchema: (config as any)?.inputSchema,
          },
        ])
      ),
    });

  } catch (error) {
    console.error('Tools API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch available tools', 
        details: error instanceof Error ? error.message : 'Unknown error',
        availableTools: [],
      },
      { status: 500 }
    );
  }
}