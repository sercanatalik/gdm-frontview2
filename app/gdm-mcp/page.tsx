'use client';

import ChatArea from './components/chat-area';
import { SuggestedQueries } from './components/suggested-queries';
import { Sparkles, Search, RotateCcw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toolOutputsActions } from '@/lib/store/tool-outputs';
import { AICharts } from "@/components/ai-elements/ai-charts";
import { messagesActions } from '@/lib/store/ai-messages';
import { EmailReportModal } from './components/email-report-modal';
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
    onFinish: (message) => {
      console.log('Chat finished:', message.messages);

      // Get the last message from the messages array
      const lastMessage = message.messages[message.messages.length - 1];
      if (lastMessage?.parts) {
        const finalMessage = lastMessage.parts[lastMessage.parts.length - 1];

        if ('state' in finalMessage && finalMessage.state === 'done') {
          // Handle the final message part
          console.log('Final message part:', finalMessage.text);

          // Add to ai-messages store
          messagesActions.addMessage({
            text: finalMessage.text,
            state: finalMessage.state,
          });
        }
      }
    },
  });

  const [inputValue, setInputValue] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
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
    toolOutputsActions.clearOutputs();
    messagesActions.clearMessages();
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

  // Handle tool output from chat conversation
  const handleToolOutput = (toolOutput: {
    toolName: string;
    output: unknown;
    input: unknown;
    state?: string;
  }) => {
    // Add to store - it will handle deduplication
    toolOutputsActions.addOutput(toolOutput);
    
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

    useEffect(() => {
    toolOutputsActions.clearOutputs();
    messagesActions.clearMessages();
  }, []);
  // Handle tool output from chat conversation

  return (
    <div className="flex flex-col p-0" style={{ height: 'calc(100vh - 10px)' }}>
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

          <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEmailModalOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Email Report
          </Button>
           <Button variant="outline" size="sm" onClick={handleClear}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          </div>
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
                  <ChatArea messages={messages} error={error} onToolOutput={handleToolOutput} />
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
                <AICharts />
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
                placeholder="Ask about financing exposure ..."
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
          
          </div>
        </div>
      </div>

      {/* Email Report Modal */}
      <EmailReportModal open={emailModalOpen} onOpenChange={setEmailModalOpen} />
    </div>
  );
}
