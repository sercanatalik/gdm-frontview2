'use client';

import React, { useState, useEffect } from 'react';
import { MicIcon, GlobeIcon } from 'lucide-react';
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
import { Image } from '@/components/ai-elements/image';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
} from '@/components/ai-elements/prompt-input';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from '@/components/ai-elements/tool';

interface ToolCall {
  toolName: string;
  result: unknown;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: MessagePart[];
  toolCalls?: ToolCall[];
}

interface MessagePart {
  type: 'text' | 'tool-call' | 'tool-result';
  text?: string;
  toolName?: string;
  args?: unknown;
  result?: unknown;
  isError?: boolean;
}

interface APIResponse {
  text: string;
  parts?: MessagePart[];
  toolCalls?: ToolCall[];
  availableTools?: string[];
}


// Function to parse data URI into base64 and mediaType
function parseDataUri(dataUri: string): { base64: string; mediaType: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return {
      mediaType: match[1],
      base64: match[2]
    };
  }
  return null;
}

// Function to render tool result content, handling images and other formats
function renderToolResult(result: unknown): React.ReactNode {
  if (!result) return 'No result';

  if (typeof result === 'object' && result !== null) {
    const toolResult = result as Record<string, unknown>;
    
    // Check if this is a tool result with nested output structure
    if (toolResult.output && typeof toolResult.output === 'object') {
      const output = toolResult.output as Record<string, unknown>;
      
      // Check for structured content with result field
      if (output.structuredContent && typeof output.structuredContent === 'object') {
        const structured = output.structuredContent as Record<string, unknown>;
        if (structured.result && typeof structured.result === 'string') {
          const dataUriParts = parseDataUri(structured.result as string);
          if (dataUriParts) {
            return (
              <Image
                base64={dataUriParts.base64}
                uint8Array={new Uint8Array()}
                mediaType={dataUriParts.mediaType}
                alt="Tool result image"
                className="max-w-full h-auto rounded-md"
              />
            );
          }
        }
      }
      
      // Check for content array with data URIs
      if (output.content && Array.isArray(output.content)) {
        return (
          <div className="space-y-2">
            {output.content.map((item: unknown, index: number) => {
              const contentItem = item as Record<string, unknown>;
              if (contentItem?.type === 'text' && typeof contentItem.text === 'string') {
                const dataUriParts = parseDataUri(contentItem.text);
                if (dataUriParts) {
                  return (
                    <Image
                      key={index}
                      base64={dataUriParts.base64}
                      uint8Array={new Uint8Array()}
                      mediaType={dataUriParts.mediaType}
                      alt={`Tool result image ${index + 1}`}
                      className="max-w-full h-auto rounded-md"
                    />
                  );
                } else {
                  return <div key={index} className="text-sm">{contentItem.text}</div>;
                }
              }
              return <pre key={index} className="text-xs">{JSON.stringify(contentItem, null, 2)}</pre>;
            })}
          </div>
        );
      }
    }
    
    // Check for direct image data structure (legacy support)
    if (toolResult.base64 && toolResult.mediaType && (toolResult.mediaType as string).startsWith('image/')) {
      return (
        <Image
          base64={toolResult.base64 as string}
          uint8Array={new Uint8Array()}
          mediaType={toolResult.mediaType as string}
          alt="Tool result image"
          className="max-w-full h-auto"
        />
      );
    }
    
    // Check for array of images (legacy support)
    if (Array.isArray(toolResult)) {
      return (
        <div className="space-y-2">
          {toolResult.map((item, index) => {
            if (item?.base64 && item?.mediaType && item.mediaType.startsWith('image/')) {
              return (
                <Image
                  key={index}
                  base64={(item as Record<string, unknown>).base64 as string}
                  uint8Array={new Uint8Array()}
                  mediaType={(item as Record<string, unknown>).mediaType as string}
                  alt={`Tool result image ${index + 1}`}
                  className="max-w-full h-auto"
                />
              );
            }
            return <pre key={index} className="text-xs">{JSON.stringify(item, null, 2)}</pre>;
          })}
        </div>
      );
    }
    
    // Check for content array (legacy support)
    if (toolResult.content && Array.isArray(toolResult.content)) {
      return (
        <div className="space-y-2">
          {(toolResult.content as unknown[]).map((item: unknown, index: number) => {
            const contentItem = item as Record<string, unknown>;
            if (contentItem?.type === 'image' && contentItem.image) {
              return (
                <Image
                  key={index}
                  base64={contentItem.image as string}
                  uint8Array={new Uint8Array()}
                  mediaType={(contentItem.mediaType as string) || 'image/png'}
                  alt={`Tool result image ${index + 1}`}
                  className="max-w-full h-auto"
                />
              );
            }
            if (contentItem?.type === 'text') {
              return <div key={index} className="text-sm">{contentItem.text as string}</div>;
            }
            return <pre key={index} className="text-xs">{JSON.stringify(contentItem, null, 2)}</pre>;
          })}
        </div>
      );
    }
  }

  // Handle direct data URI strings
  if (typeof result === 'string') {
    const dataUriParts = parseDataUri(result);
    if (dataUriParts) {
      return (
        <Image
          base64={dataUriParts.base64}
          uint8Array={new Uint8Array()}
          mediaType={dataUriParts.mediaType}
          alt="Tool result image"
          className="max-w-full h-auto"
        />
      );
    }
    return result;
  }

  // Fallback to JSON representation
  return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
}

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  // Fetch available tools on page load
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/gdm-frontview/api/ai/tools');
        if (response.ok) {
          const tools = await response.json();
          if (tools.availableTools && tools.availableTools.length > 0) {
            setAvailableTools(tools.availableTools);
            // Start with no tools selected - let user choose
            setSelectedTools(new Set());
          }
        }
      } catch (error) {
        console.error('Failed to fetch available tools:', error);
      }
    };

    fetchTools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/gdm-frontview/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.trim(),
          selectedTools: Array.from(selectedTools),
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result: APIResponse = await response.json();

      // Update available tools list
      if (result.availableTools && result.availableTools.length > 0) {
        setAvailableTools(result.availableTools);
        // Keep current selection - don't auto-select tools
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text || 'No response received.',
        parts: result.parts || [],
        toolCalls: result.toolCalls || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="p-6 pb-4">
        <h2 className="text-3xl font-bold tracking-tight">AI Chat</h2>
        <p className="text-muted-foreground">
          Chat with AI assistant powered by Anthropic Claude
        </p>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Debug Section */}
        {messages.length > 0 && (
          <div className="border-b p-4 bg-gray-50 max-h-48 overflow-auto">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-600 mb-2">
                Debug: Raw Messages ({messages.length})
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(messages, null, 2)}
              </pre>
            </details>
          </div>
        )}
        
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
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts && message.parts.length > 0 ? (
                      // Use parts structure if available
                      message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {part.text} 
                              </Response>
                            );
                          case 'tool-call':
                            return (
                              <Tool key={`${message.id}-${i}`}>
                                <ToolHeader type="tool-call" state={'output-available' as const} />
                                <ToolContent>
                                  <ToolInput input={`Tool: ${part.toolName}`} />
                                  <ToolOutput 
                                    output={part.args ? JSON.stringify(part.args, null, 2) : 'Tool called'}
                                    errorText={undefined}
                                  />
                                </ToolContent>
                              </Tool>
                            );
                          case 'tool-result':
                            return (
                              <div key={`${message.id}-${i}`} className="my-4">
                                {renderToolResult(part.result)}
                              </div>
                            );
                          default:
                            return null;
                        }
                      })
                    ) : (
                      // Fallback to original structure
                      <>
                        <Response>{message.content}</Response>
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {message.toolCalls.map((toolCall, index) => (
                              <Tool key={index}>
                                <ToolHeader type="tool-call" state={'output-available' as const} />
                                <ToolContent>
                                  <ToolInput input={`Tool: ${toolCall.toolName}`} />
                                  <ToolOutput 
                                    output={renderToolResult(toolCall.result)}
                                    errorText={undefined}
                                  />
                                </ToolContent>
                              </Tool>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        
        <div className="border-t p-4">
          <PromptInput onSubmit={handleSubmit} className="mt-4">
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder="Ask me anything about your data..."
              disabled={isLoading}
            />
            <PromptInputToolbar>
              <PromptInputTools>
              
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">
                    Tools ({selectedTools.size}/{availableTools.length})
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {availableTools.map((tool) => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => {
                          setSelectedTools(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(tool)) {
                              newSet.delete(tool);
                            } else {
                              newSet.add(tool);
                            }
                            return newSet;
                          });
                        }}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          selectedTools.has(tool)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTools(new Set(availableTools))}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTools(new Set())}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </PromptInputTools>
              <PromptInputSubmit disabled={!input} status={isLoading ? 'submitted' : undefined} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}