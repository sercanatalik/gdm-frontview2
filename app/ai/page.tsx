'use client';

import { ChatConversation } from '@/components/ai-elements/chat-conversation';
import { type PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { SuggestedQueries } from './suggested-queries';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Header } from "@/components/header";
import { Search } from "@/components/search";
import { toolOutputsActions } from '@/lib/store/tool-outputs';
import { AICharts } from "@/components/ai-elements/ai-charts";



export default function AIPlaygroundPage() {

  const {
    messages: messages2,
    sendMessage: sendMessage2,
    error: error2,
    stop,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({ api: 'api/ai/financing' }),
    onError: (error) => {
      console.error('Chat 2 error:', error);
    },
  });

  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleClear = () => {
    // Stop any ongoing streaming
    stop();

    // Reset conversation
    setMessages([]);

    // Reset UI state
    setSubmitted(false);
    setInputValue('');

    // Clear tool outputs from store
    toolOutputsActions.clearOutputs();
  };

  const handleSubmit = (value: string) => {
    setSubmitted(true);

    // Send to chat
    sendMessage2({ text: value });
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  // Handle tool output from chat conversation
  const handleToolOutput = (toolOutput: {
    toolName: string;
    output: unknown;
    input: unknown;
    state?: string;
  }) => {
    // Add to store - it will handle deduplication
    // console.log('Adding tool output to store:', toolOutput.input);
    toolOutputsActions.addOutput(toolOutput);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">AI Playground</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">Powered by AI Markets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Only show after submission */}
      {submitted && (
        <div className="flex-1 w-full overflow-hidden">
          <div className="h-full grid grid-cols-2 gap-4 p-4">
            {/* Conversation Column - 50% */}
            <div className="flex flex-col h-full">
              <div className="rounded-lg border bg-card shadow-sm flex flex-col overflow-hidden h-full">
                <div className="px-4 py-3 border-b bg-muted/50 shrink-0">
                  <h3 className="text-sm font-semibold">GDM MCP - Conversation</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatConversation
                    messages={messages2}
                    error={error2}
                    onToolOutput={handleToolOutput}
                  />
                </div>
              </div>
            </div>

            {/* AI Charts Column - 50% */}
            <div className="flex flex-col h-full">
              <div className="rounded-lg border bg-card shadow-sm h-full overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b bg-muted/50 shrink-0">
                  <h3 className="text-sm font-semibold">AI Charts</h3>
                </div>
                <div className="flex-1 overflow-auto">
                  <AICharts />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Queries - Show when no submission */}
      {!submitted && (
        <div className="flex-1 flex items-end justify-center pb-4">
          <div className="max-w-4xl w-full px-6">
            <AnimatePresence mode="wait">
              <SuggestedQueries
                handleSuggestionClick={handleSuggestionClick}
              />
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Search Section - Fixed at bottom */}
      <div className="px-6 py-4 border-t bg-background shrink-0">
        <div className="max-w-3xl mx-auto">
          <Search
            handleClear={handleClear}
            handleSubmit={handleSubmit}
            inputValue={inputValue}
            setInputValue={setInputValue}
            submitted={submitted}
            className=""
          />
        </div>
      </div>
    </div>
  );
}
