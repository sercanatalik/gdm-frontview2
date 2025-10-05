import { experimental_createMCPClient, streamText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';

import { anthropic } from '@ai-sdk/anthropic';
import { StreamableHTTPClientTransport } from '@@modelcontextprotocol/sdk/client/streamableHttp';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  try {
   
    // You can also connect to StreamableHTTP MCP servers
    const httpTransport = new StreamableHTTPClientTransport(
      new URL('http://localhost:3030/mcp'),
    );
    const httpClient = await experimental_createMCPClient({
      transport: httpTransport,
    });

    const toolSetTwo = await httpClient.tools();
    const tools = {
      ...toolSetTwo,
    };

    const response = await streamText({
      model: anthropic('claude-sonnet-4-0'),
      tools,
      prompt,
      // When streaming, the client should be closed after the response is finished:
      onFinish: async () => {
        await httpClient.close();
      },
      // Closing clients onError is optional
      // - Closing: Immediately frees resources, prevents hanging connections
      // - Not closing: Keeps connection open for retries
      onError: async error => {
        await httpClient.close();
      },
    });

    return response.toTextStreamResponse();
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}