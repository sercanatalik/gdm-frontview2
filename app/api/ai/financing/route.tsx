import { anthropic } from '@ai-sdk/anthropic';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  experimental_createMCPClient,
  stepCountIs,
  UIMessage,
  convertToModelMessages,
  streamText,
} from 'ai';
import { SYSTEM_PROMPT } from './prompt';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const MCP_SERVER_URL = 'http://127.0.0.1:8000/mcp';
const MAX_STEPS = 15;
const MAX_RETRIES = 5;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Connect to StreamableHTTP MCP server
    const httpTransport = new StreamableHTTPClientTransport(
      new URL(MCP_SERVER_URL)
    );
    const httpClient = await experimental_createMCPClient({
      transport: httpTransport,
    });

    const toolSet = await httpClient.tools();

    const result = streamText({
      model: anthropic('claude-opus-4-20250514'),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      tools: toolSet,
      maxRetries: MAX_RETRIES,
      stopWhen: stepCountIs(MAX_STEPS),
    })

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('AI financing route error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process AI request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}