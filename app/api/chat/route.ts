import { openai } from '@ai-sdk/openai';
import { experimental_createMCPClient, streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  try {
    // Create MCP client for your SSE server
    const client = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: 'http://127.0.0.1:9000/sse/',
      },
    });

    // Get available tools from the MCP server
    const tools = await client.tools();

    // Stream text with MCP tools
    const response = streamText({
      model: openai('gpt-4o-mini'),
      tools,
      prompt,
      system: 'You are a helpful assistant that can answer questions and help with tasks. Use the available tools when appropriate.',
      onFinish: async () => {
        await client.close();
      },
      onError: async () => {
        await client.close();
      },
    });

    return response.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}