'use client';

import { useState, useRef, useCallback } from 'react';
import { experimental_createMCPClient, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
} from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';

interface ToolInvocation {
  toolName: string;
  state: 'result' | 'call' | 'partial-call';
  result?: unknown;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef<ReturnType<typeof experimental_createMCPClient> | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create MCP client
      const client = await experimental_createMCPClient({
        transport: {
          type: 'sse',
          url: 'http://127.0.0.1:9001/sse/',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Cors': 'no-cors',
          },
        },
      });
      clientRef.current = client;

      // Get available tools
      const tools = await client.tools();

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        toolInvocations: [],
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Stream response
      const response = streamText({
        model: openai('gpt-4o-mini'),
        tools,
        prompt: input.trim(),
        system: 'You are a helpful assistant that can answer questions and help with tasks. Use the available tools when appropriate.',
      });

      let fullContent = '';
      
      // Handle streaming text content
      for await (const chunk of response.textStream) {
        fullContent += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: fullContent }
              : msg
          )
        );
      }

      // Get the final result to access tool calls
      const result = await response;
      
      // Handle tool invocations if present
      const toolCalls = await result.toolCalls;
      if (toolCalls && toolCalls.length > 0) {
        const toolInvocations = toolCalls.map((toolCall: {
          toolName: string;
          result: unknown;
        }) => ({
          toolName: toolCall.toolName,
          state: 'result' as const,
          result: toolCall.result,
        }));

        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, toolInvocations }
              : msg
          )
        );
      }

      // Clean up
      await client.close();
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          return prev.map(msg => 
            msg.id === lastMessage.id 
              ? { ...msg, content: 'Sorry, there was an error processing your request.' }
              : msg
          );
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      if (clientRef.current) {
        await clientRef.current.close();
        clientRef.current = null;
      }
    }
  }, [input, isLoading]);

  const renderMessage = (message: Message) => {
    // Handle tool invocations if present
    if (message.toolInvocations && message.toolInvocations.length > 0) {
      return (
        <div className="space-y-2">
          {message.content && <Response>{message.content}</Response>}
          {message.toolInvocations.map((tool, index) => (
            <div key={index} className="border rounded-lg p-3 bg-muted/30">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                🔧 Tool: {tool.toolName}
              </div>
              <div className="text-sm">
                {tool.state === 'result' && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <div className="font-medium text-green-800 dark:text-green-200 mb-1">Result:</div>
                    <pre className="whitespace-pre-wrap text-green-700 dark:text-green-300">
                      {typeof tool.result === 'string' 
                        ? tool.result 
                        : JSON.stringify(tool.result, null, 2)}
                    </pre>
                  </div>
                )}
                {tool.state === 'partial-call' && (
                  <div className="text-blue-600 dark:text-blue-400">
                    Preparing tool call...
                  </div>
                )}
                {tool.state === 'call' && (
                  <div className="text-yellow-600 dark:text-yellow-400">
                    Executing tool...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Regular text message
    return <Response>{message.content || ''}</Response>;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">AI Chat</h2>
        <p className="text-muted-foreground">
          Chat with AI assistant powered by MCP
        </p>
        <p className="text-xs text-muted-foreground">
          Connected to MCP server at http://127.0.0.1:9000/sse/
        </p>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-lg font-semibold text-muted-foreground mb-2">
                    Start a conversation
                  </div>
                  <p className="text-muted-foreground">
                    Ask questions about your data, get insights, or request analytics
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    MCP tools will be available automatically when needed
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {renderMessage(message)}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        
        <div className="border-t p-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about your data..."
              disabled={isLoading}
            />
            <PromptInputToolbar>
              <div></div>
              <PromptInputSubmit 
                disabled={!input?.trim() || isLoading}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}