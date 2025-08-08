'use client';

import { useChat } from '@ai-sdk/react'


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
import { useState } from 'react';

export default function Chat() {
  const { messages, sendMessage, status } = useChat() as any;
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    try {
      await sendMessage({
        role: 'user',
        content: input,
      });
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const isLoading = status === 'streaming' || status === 'awaiting_message';

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">AI Chat</h2>
        <p className="text-muted-foreground">
          Chat with AI assistant for insights and analytics
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
              messages.map((message: any, index: number) => (
                <Message key={index} from={message.role}>
                  <MessageContent>
                    <Response>{String(message.content || '')}</Response>
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
            />
            <PromptInputToolbar>
              <div></div>
              <PromptInputSubmit 
                status={isLoading ? 'streaming' : undefined}
                disabled={!input.trim() || isLoading}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}