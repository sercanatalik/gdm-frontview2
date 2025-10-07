'use client';

import ChatArea from './components/chat-area';
import { Sparkles, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { nanoid } from 'nanoid';

export default function GdmMcpPage() {
  const [messages, setMessages] = useState<
    { key: string; value: string; name: string; avatar: string }[]
  >([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      key: nanoid(),
      value: inputValue,
      name: 'User',
      avatar: 'https://github.com/shadcn.png',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        key: nanoid(),
        value: 'Processing your query about ' + inputValue,
        name: 'AI Assistant',
        avatar: 'https://github.com/openai.png',
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);
  };

  const handleClear = () => {
    setMessages([]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b bg-background px-6 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">GDM AI Playground</h1>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 text-primary">
              <Sparkles className="h-3 w-3" />
              <span className="text-xs font-medium">AI Markets</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex min-h-0 flex-1">
          <div className="flex w-1/2 flex-col border-r">
            <div className="flex-1 overflow-hidden">
              <ChatArea messages={messages} />
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t bg-card p-4 shadow-lg">
              <Input
                placeholder="Ask about financing exposure or pnl..."
                className="h-11 flex-1 border-2"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button size="default" variant="default" className="h-11 px-5" onClick={handleSend}>
                <Send className="mr-1.5 h-4 w-4" />
                Send
              </Button>
              <Button size="default" variant="ghost" className="h-11" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>
          <div className="flex w-1/2 flex-col p-4 overflow-auto">
            {/* Right column content goes here */}
          </div>
        </div>
      </div>
    </>
  );
}
