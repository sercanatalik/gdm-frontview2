'use client';

import { ChatConversation } from '@/components/ai-elements/chat-conversation';
import { type PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { SuggestedQueries } from './suggested-queries';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Header } from "@/components/header";
import { Search } from "@/components/search";
import { ToolOutputStream } from "@/components/ai-elements/tool-outputstream";
import { toolOutputsActions } from '@/lib/store/tool-outputs';




export default function AIPlaygroundPage() {

  const {
    messages: messages2,
    sendMessage: sendMessage2,
    status: status2,
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
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [chartConfig, setChartConfig] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);

  const handleClear = () => {
    // Stop any ongoing streaming
    stop();

    // Reset conversation
    setMessages([]);

    // Reset UI state
    setSubmitted(false);
    setInputValue('');
    setActiveQuery('');
    setResults([]);
    setChartConfig(null);
    setColumns([]);
    setLoading(false);

    // Clear tool outputs from store
    toolOutputsActions.clearOutputs();
  };

  const handleSubmit = (value: string) => {
    setInputValue(value);
    setSubmitted(true);
    setLoading(true);
    setLoadingStep(1);

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
    <div className="p-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">AI Playground</h2>
      </div>

      <div className="space-y-6">
        {/* Two Conversation Columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* First Conversation Column */}
          <div className="rounded-lg border border-border bg-card">
             <ChatConversation
               messages={messages2}
               error={error2}
               onToolOutput={handleToolOutput}
             />

            {/* <ChatConversation messages={messages1} error={error1} /> */}
          </div>

          {/* Second Conversation Column - Tool Outputs */}
          <ToolOutputStream />
        </div>

        {/* Search and Results Section */}
        <div className="p-6 sm:p-8 flex flex-col flex-grow">
          {/* <Header handleClear={handleClear} /> */}
          <Search
            handleClear={handleClear}
            handleSubmit={handleSubmit}
            inputValue={inputValue}
            setInputValue={setInputValue}
            submitted={submitted}
          />
          <div
            id="main-container"
            className="flex-grow flex flex-col sm:min-h-[420px]"
          >
            <div className="flex-grow h-full">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <SuggestedQueries
                    handleSuggestionClick={handleSuggestionClick}
                  />
                ) : (
                 <div></div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
