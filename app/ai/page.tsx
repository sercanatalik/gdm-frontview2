'use client';

import { useState, useEffect } from 'react';
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
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
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
  result: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

interface APIResponse {
  text: string;
  toolCalls?: ToolCall[];
  availableTools?: string[];
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
            // Select all tools by default
            setSelectedTools(new Set(tools.availableTools));
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

      // Update available tools and select all by default if this is the first time
      if (result.availableTools && result.availableTools.length > 0) {
        setAvailableTools(result.availableTools);
        if (selectedTools.size === 0) {
          setSelectedTools(new Set(result.availableTools));
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text || 'No response received.',
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
                    <Response>{message.content}</Response>
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.toolCalls.map((toolCall, index) => (
                          <Tool key={index}>
                            <ToolHeader type="tool-call" state={'output-available' as const} />
                            <ToolContent>
                              <ToolInput input={`Tool: ${toolCall.toolName}`} />
                              <ToolOutput 
                                output={typeof toolCall.result === 'string' 
                                  ? toolCall.result 
                                  : JSON.stringify(toolCall.result, null, 2)}
                                errorText={undefined}
                              />
                            </ToolContent>
                          </Tool>
                        ))}
                      </div>
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
                <PromptInputButton>
                  <MicIcon size={16} />
                </PromptInputButton>
                <PromptInputButton>
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setSelectedTools(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(value)) {
                        newSet.delete(value);
                      } else {
                        newSet.add(value);
                      }
                      return newSet;
                    });
                  }}
                  value={Array.from(selectedTools)[0] || ''}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue placeholder="Select Tools" />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {availableTools.map((tool) => (
                      <PromptInputModelSelectItem key={tool} value={tool}>
                        {tool} {selectedTools.has(tool) ? '✓' : ''}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit disabled={!input} status={isLoading ? 'submitted' : undefined} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}