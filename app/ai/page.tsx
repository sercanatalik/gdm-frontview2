'use client';

import { ChatConversation } from '@/components/ai-elements/chat-conversation';
import { ChatPrompt } from '@/components/ai-elements/chat-prompt';
import { type PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';




export default function AIPlaygroundPage() {
  
  const {
    messages: messages2,
    sendMessage: sendMessage2,
    status: status2,
    error: error2,
  } = useChat({
    transport: new DefaultChatTransport({ api: 'api/ai/financing' }),
    onError: (error) => {
      console.error('Chat 2 error:', error);
    },
  });

  // Common submit handler - sends to both chats
  const onSubmit = (message: PromptInputMessage) => {
    const text = message.text || '';

    if (text.trim() || message.files?.length) {
      const payload = {
        text,
        files: message.files,
      };

      // Send to chat instance
      sendMessage2(payload);
    }
  };

  // Determine if chat is not ready
  const isDisabled = status2 !== 'ready';

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
             <ChatConversation messages={messages2} error={error2} />
         
            {/* <ChatConversation messages={messages1} error={error1} /> */}
          </div>

          {/* Second Conversation Column */}
          <div className="rounded-lg border border-border bg-card">
            {/* <ChatConversation messages={messages2} error={error2} /> */}
          </div>
        </div>

        {/* Common Prompt Input for Conversation */}
        <ChatPrompt onSubmit={onSubmit} disabled={isDisabled} />
       
      </div>
    </div>
  );
}
