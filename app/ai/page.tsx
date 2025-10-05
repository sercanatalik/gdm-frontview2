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
  // First chat instance
  const {
    messages: messages1,
    sendMessage: sendMessage1,
    status: status1,
    error: error1,
  } = useChat({
    transport: new DefaultChatTransport({ api: 'api/chat' }),
    onError: (error) => {
      console.error('Chat 1 error:', error);
    },
  });

  // Second chat instance
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

      // Send to both chat instances
      sendMessage1(payload);
      sendMessage2(payload);
    }
  };

  // Determine if either chat is not ready
  const isDisabled = status1 !== 'ready' || status2 !== 'ready';

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
            <ChatConversation messages={messages1} error={error1} />
          </div>

          {/* Second Conversation Column */}
          <div className="rounded-lg border border-border bg-card">
            <ChatConversation messages={messages2} error={error2} />
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
                disabled={isDisabled}
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
              <PromptInputSubmit disabled={isDisabled} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
