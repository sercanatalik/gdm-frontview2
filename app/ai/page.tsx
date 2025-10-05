'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
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
        <div className="rounded-lg border border-border bg-card">
          <div className="flex h-[600px] flex-col">
            <Conversation>
              <ConversationContent>
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Start a conversation...
                  </div>
                ) : (
                  messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.parts?.map((part, index) => {
                          if (part.type === 'text') {
                            return (
                              <Response key={index}>
                                {part.text}
                              </Response>
                            );
                          }
                          return null;
                        })}
                      </MessageContent>
                    </Message>
                  ))
                )}
                {error && (
                  <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                    Error: {error.message}
                  </div>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            <PromptInput onSubmit={onSubmit} className="border-t" globalDrop multiple>
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
    </div>
  );
}
