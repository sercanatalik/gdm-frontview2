'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { UIMessage } from 'ai';
import { useEffect, useRef } from 'react';

interface ChatConversationProps {
  messages: UIMessage[];
  error?: Error;
  onToolOutput?: (toolOutput: {
    toolName: string;
    output: unknown;
    input: unknown;
    state?: string;
  }) => void;
}

export function ChatConversation({ messages, error, onToolOutput }: ChatConversationProps) {
  const processedToolsRef = useRef<Set<string>>(new Set());

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
            input: 'input' in part ? part.input : part.toolInput || undefined,
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

                    // Handle text parts
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
                      // Extract tool name from type (e.g., 'tool-execute_query' -> 'execute_query')
                      const toolName = part.type
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
