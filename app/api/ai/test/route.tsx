import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, experimental_createMCPClient, streamText, stepCountIs, UIMessage } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Allow streaming responses up to 30 seconds
export const maxDuration = 90;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Connect to StreamableHTTP MCP server
    const httpTransport = new StreamableHTTPClientTransport(
      new URL('http://127.0.0.1:8000/mcp'),
    );
    const httpClient = await experimental_createMCPClient({
      transport: httpTransport,
    });

    const toolSet = await httpClient.tools();

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

    const result = await streamText({
      model: anthropic('claude-opus-4-20250514'),
      system: `You are a helpful ClickHouse database assistant with access to SQL functions.

IMPORTANT INSTRUCTIONS:
1. Always use the available tools to query the database
2. After receiving tool results, you MUST analyze the data deeply
3. For each tool result, you should:
   a) First, provide a clear summary of what the data shows
   b) Then, automatically execute additional queries to explore the data further
   c) Make follow-up tool calls to get more details about interesting findings
4. Use the tools multiple times in sequence to drill down into the data
5. Examples of multi-step analysis:
   - If you get a list of tables, query one of them to see sample data
   - If you see aggregate data, query for detailed breakdowns
   - If you find interesting values, investigate them further
6. Continue using tools until you have thoroughly explored the user's question
7. Be proactive - don't ask the user for permission to explore, just do it
8. Be concise in your explanations but thorough in your analysis
9. Always end with a summary of your findings
10. Always use default database and f_exposure table
`,
      messages: modelMessages,
      tools: toolSet,
      maxRetries: 4,
      stopWhen: stepCountIs(15),

      onStepFinish: async ({ text, toolCalls, toolResults, finishReason }) => {
        console.log('[Step Finished]', {
          hasText: text,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
          finishReason,
        });
      },
    });
    
    await httpClient.close();

    return  new Response(result.fullStream, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
    

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}