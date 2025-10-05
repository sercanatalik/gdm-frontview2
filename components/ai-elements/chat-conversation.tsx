'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { UIMessage } from 'ai';

interface ChatConversationProps {
  messages: UIMessage[];
  error?: Error;
}

export function ChatConversation({ messages, error }: ChatConversationProps) {
  return (
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
    </div>
  );
}
