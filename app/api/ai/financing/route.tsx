import { anthropic } from '@ai-sdk/anthropic';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  experimental_createMCPClient,
  stepCountIs,
  UIMessage,
  convertToModelMessages,
  streamText,wrapLanguageModel
} from 'ai';
import { cacheMiddleware } from '@/lib/ai/cache-middleware';

import { SYSTEM_PROMPT } from './prompt';


const wrappedModel = wrapLanguageModel({
  // model: anthropic('claude-3-haiku-20240307'),
  // model: anthropic('claude-3-5-haiku-20241022'),
  model: anthropic('claude-sonnet-4-5-20250929'),
  middleware: cacheMiddleware,
});


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
      model: wrappedModel,
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