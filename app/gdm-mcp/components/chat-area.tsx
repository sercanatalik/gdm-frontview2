'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { MessageSquareIcon } from 'lucide-react';
import type { UIMessage } from 'ai';
import { useEffect, useMemo, useRef } from 'react';

interface ChatAreaProps {
  messages: UIMessage[];
  error?: Error;
  onToolOutput?: (toolOutput: {
    toolName: string;
    output: unknown;
    input: unknown;
    state?: string;
  }) => void;
}

const ChatArea = ({ messages, error, onToolOutput }: ChatAreaProps) => {
  const processedToolsRef = useRef<Set<string>>(new Set());

  // Deduplicate messages by ID
  const uniqueMessages = useMemo(() => {
    return messages.reduce((acc, message) => {
      if (!acc.find(m => m.id === message.id)) {
        acc.push(message);
      }
      return acc;
    }, [] as UIMessage[]);
  }, [messages]);

  // Extract and send tool outputs to parent
  useEffect(() => {
    if (!onToolOutput) return;

    messages.forEach((message) => {
      message.parts?.forEach((part, partIndex) => {
        const toolKey = `${message.id}-${partIndex}`;

        // Skip if already processed
        if (processedToolsRef.current.has(toolKey)) return;

        // Handle dynamic tool calls
        if (part.type === 'dynamic-tool' && part.output && part.state === 'output-available') {
          onToolOutput({
            toolName: part.toolName,
            output: part.output,
            input: 'input' in part ? part.input : undefined,
            state: part.state,
          });
          processedToolsRef.current.add(toolKey);
        }

        // Handle regular tool calls
        if (part.type.includes('tool') && 'input' in part) {
          const output = 'output' in part ? part.output : undefined;
          const state = 'state' in part ? part.state : 'output-available';

          if (output && state === 'output-available') {
            onToolOutput({
              toolName: part.type,
              output,
              input: part.input,
              state,
            });
            processedToolsRef.current.add(toolKey);
          }
        }
      });
    });
  }, [messages, onToolOutput]);

  return (
    <Conversation className="flex-1" aria-label="Chat conversation">
      <ConversationContent>
        {uniqueMessages.length === 0 ? (
          <ConversationEmptyState
            icon={<MessageSquareIcon className="size-6" />}
            title="Start a conversation"
            description="Messages will appear here as the conversation progresses."
          />
        ) : (
          uniqueMessages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts?.map((part, index) => {
                  // Handle text parts with markdown rendering
                  if (part.type === 'text') {
                    return (
                      <Response key={index}>
                        {part.text}
                      </Response>
                    );
                  }

                  // Handle dynamic tool calls
                  if (part.type === 'dynamic-tool') {
                    return (
                      <Tool key={index} defaultOpen={false}>
                        <ToolHeader
                          type={part.type}
                          title={part.toolName}
                          state={part.state}
                        />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          <ToolOutput
                            output={part.output}
                            errorText={part.errorText}
                          />
                        </ToolContent>
                      </Tool>
                    );
                  }

                  // Handle tool calls - check if part has the required tool properties
                  if (part.type.includes('tool') && 'input' in part) {
                    const toolName = part.type;
                    const state = 'state' in part ? part.state : 'output-available';
                    const output = 'output' in part ? part.output : undefined;

                    return (
                      <Tool key={index} defaultOpen={false}>
                        <ToolHeader
                          type={part.type}
                          title={toolName}
                          state={state}
                        />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          <ToolOutput
                            output={output}
                            errorText={'errorText' in part ? part.errorText : undefined}
                          />
                        </ToolContent>
                      </Tool>
                    );
                  }

                  return null;
                })}
              </MessageContent>
              <MessageAvatar className='mt-1 size-8'
                name={message.role === 'user' ? 'User' : 'AI Assistant'}
                src={message.role === 'user' ? 'https://github.com/shadcn.png' : 'https://github.com/openai.png'}
              />
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
  );
};

export default ChatArea;
