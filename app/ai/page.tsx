'use client';

import { useState } from 'react';
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
                          <div key={index} className="border rounded-lg p-3 bg-muted/30">
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              🔧 Tool: {toolCall.toolName}
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <div className="font-medium text-green-800 dark:text-green-200 mb-1">
                                Result:
                              </div>
                              <pre className="whitespace-pre-wrap text-green-700 dark:text-green-300 text-sm">
                                {typeof toolCall.result === 'string' 
                                  ? toolCall.result 
                                  : JSON.stringify(toolCall.result, null, 2)}
                              </pre>
                            </div>
                          </div>
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
          {/* Tool Selection */}
          {availableTools.length > 0 && (
            <div className="mb-4 p-3 bg-muted/20 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium">
                  🔧 Available Tools ({availableTools.length})
                  {selectedTools.size > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({selectedTools.size} selected)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTools(new Set(availableTools))}
                    className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded border border-primary/20 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedTools(new Set())}
                    className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded border transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTools.map((toolName) => {
                  const isSelected = selectedTools.has(toolName);
                  return (
                    <button
                      key={toolName}
                      onClick={() => {
                        const newSet = new Set(selectedTools);
                        if (isSelected) {
                          newSet.delete(toolName);
                        } else {
                          newSet.add(toolName);
                        }
                        setSelectedTools(newSet);
                      }}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-xs border transition-all hover:scale-105 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                      }`}
                    >
                      <span className="font-mono font-medium">{toolName}</span>
                      {isSelected && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                💡 Selected tools will be available to the AI assistant
              </div>
            </div>
          )}
          
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your data..."
              disabled={isLoading}
            />
            <PromptInputToolbar>
              <div className="flex items-center text-xs text-muted-foreground">
                {isLoading ? 'Processing...' : 
                  selectedTools.size > 0 ? 
                    `${selectedTools.size} tools selected` : 
                    'Ready to chat'}
              </div>
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