'use client';

import { ChatConversation } from '@/components/ai-elements/chat-conversation';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export default function AIPlaygroundPage() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: 'api/chat' }),
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const onSubmit = (message: PromptInputMessage) => {
    const text = message.text || '';

    if (text.trim() || message.files?.length) {
      sendMessage({
        text,
        files: message.files,
      });
    }
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
            <ChatConversation messages={messages} error={error} />
          </div>

          {/* Second Conversation Column */}
          <div className="rounded-lg border border-border bg-card">
            <ChatConversation messages={messages} error={error} />
          </div>
        </div>

        {/* Common Prompt Input for Both Conversations */}
        <div className="rounded-lg border border-border bg-card">
          <PromptInput onSubmit={onSubmit} globalDrop multiple>
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                placeholder="Ask anything..."
                disabled={status !== 'ready'}
              />
            </PromptInputBody>
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit disabled={status !== 'ready'} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
