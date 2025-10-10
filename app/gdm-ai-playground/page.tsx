'use client';

import ChatArea from './components/chat-area';
import { SuggestedQueries } from '../ai/suggested-queries';
import { Sparkles, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export default function GdmMcpPage() {
  const {
    messages,
    sendMessage,
    error,
    stop,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({ api: 'api/ai/financing' }),
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    sendMessage({ text: inputValue });
    setInputValue('');
  };

  const handleClear = () => {
    stop();
    setMessages([]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col p-0" style={{ height: 'calc(100vh - 90px)' }}>
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">GDM AI Playground</h2>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">AI Markets</span>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {/* Top Row - 2 Cards */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {/* Left Card - Chat */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>AI Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <ChatArea messages={messages} error={error} />
                  <div ref={chatEndRef} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Card - Market Analysis */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <p className="text-sm text-muted-foreground">Chart visualization area</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Suggested Queries - Centered above input */}
      {messages.length === 0 && (
        <div className="flex flex-1 items-end justify-center pb-4">
          <div className="w-full max-w-4xl px-6">
            <AnimatePresence mode="wait">
              <SuggestedQueries handleSuggestionClick={handleSuggestionClick} />
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Fixed Input Section at Bottom */}
      <div className="shrink-0 border-t bg-background pt-4">
        <div className="mx-auto w-full max-w-4xl px-6 space-y-3">
          {/* Input Area */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ask about startup unicorns..."
                className="h-12 pl-12 pr-4 text-base"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <Button
              size="lg"
              className="h-12 px-8"
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              Send
            </Button>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6"
                onClick={handleClear}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
