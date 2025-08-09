import { NextRequest, NextResponse } from 'next/server';
import { experimental_createMCPClient, dynamicTool, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(request: NextRequest) {
  try {
    const { prompt, selectedTools } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

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
      console.warn('MCP server connection failed, proceeding without tools:', mcpError);
    }

    // Convert MCP tools to dynamic tools with proper schema validation
    const dynamicTools: Record<string, any> = {};
    
    // Filter tools based on selectedTools array
    const toolsToUse = selectedTools && Array.isArray(selectedTools) && selectedTools.length > 0
      ? Object.fromEntries(Object.entries(tools).filter(([toolName]) => selectedTools.includes(toolName)))
      : tools;
    
    console.log('Selected tools from request:', selectedTools);
    console.log('Available tools:', Object.keys(tools));
    console.log('Tools to use:', Object.keys(toolsToUse));
    
    if (Object.keys(toolsToUse).length > 0) {
      for (const [toolName, toolConfig] of Object.entries(toolsToUse)) {
        try {
          // Ensure proper schema structure
          const schema = (toolConfig as any)?.inputSchema || {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Query or input for the tool',
              },
            },
            required: ['query'],
          };

          // Validate that schema has required type field
          if (!schema.type) {
            schema.type = 'object';
          }

          dynamicTools[toolName] = dynamicTool({
            description: (toolConfig as any)?.description || `MCP tool: ${toolName}`,
            inputSchema: schema,
            execute: async (params: any) => {
              if (!mcpClient) throw new Error('MCP client not available');
              try {
                const resolvedClient = await mcpClient;
                const result = await resolvedClient.callTool({
                  name: toolName,
                  arguments: params,
                });
                return result;
              } catch (error) {
                throw new Error(`Tool execution failed: ${error}`);
              }
            },
          });
        } catch (toolError) {
          console.warn(`Failed to create tool ${toolName}:`, toolError);
        }
      }
    }

    // Generate response with AI
    const modelName = process.env.NEXT_PUBLIC_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    
    const result = await generateText({
      model: anthropic(modelName),
      tools: dynamicTools,
      prompt: prompt,
      system: 'You are a helpful assistant that can analyze data and help with tasks. Use the available tools when appropriate to provide accurate and helpful responses.',
    });

    // Close MCP client if it was created
    if (mcpClient) {
      try {
        const resolvedClient = await mcpClient;
        await resolvedClient.close();
      } catch (closeError) {
        console.warn('Failed to close MCP client:', closeError);
      }
    }

    // Build parts array following the useChat structure
    const parts: any[] = [];
    
    // Add text part if there's text content
    if (result.text) {
      parts.push({
        type: 'text',
        text: result.text
      });
    }
    
    // Add tool call parts
    if (result.toolCalls && result.toolCalls.length > 0) {
      result.toolCalls.forEach((toolCall: any) => {
        parts.push({
          type: 'tool-call',
          toolName: toolCall.toolName,
          args: toolCall.args || {}
        });
      });
    }
    
    // Add tool result parts  
    if (result.toolResults && result.toolResults.length > 0) {
      result.toolResults.forEach((toolResult: any) => {
        parts.push({
          type: 'tool-result',
          toolName: toolResult.toolName,
          result: toolResult.result || toolResult,
          isError: false
        });
      });
    }


    return NextResponse.json({
      text: result.text,
      parts: parts,
      toolCalls: result.toolCalls?.map((toolCall: any) => ({
        toolName: toolCall.toolName,
        result: toolCall.result || JSON.stringify(toolCall.args || {}, null, 2),
      })) || [],
      availableTools: Object.keys(tools),
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI chat request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}