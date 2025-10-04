"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Message, MessageContent } from "@/components/ai-elements/message"
import {
  PromptInput as Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"
import { Response } from "@/components/ai-elements/response"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { MessageSquare } from "lucide-react"
import { useState } from "react"

export default function ChatPage() {
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "../api/chat/langchain" }),
  })

  const suggestions = [
    "Explain quantum computing in simple terms",
    "Write a haiku about coding",
    "What are the best practices for React?",
    "Help me debug a JavaScript error",
  ]

  const handleSubmit = () => {
    if (input.trim()) {
      sendMessage({ text: input })
      setInput("")
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  return (
    <div className="p-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
      </div>

      <div className="relative w-full rounded-lg border h-[calc(100vh-8rem)]">
        <div className="flex flex-col h-full">
          <Conversation>
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="Start a conversation"
                  description="Type a message below to begin chatting"
                >
                  <div className="w-full max-w-md mt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Try asking:</p>
                    <Suggestions>
                      {suggestions.map((suggestion, index) => (
                        <Suggestion key={index} suggestion={suggestion} onClick={handleSuggestionClick} />
                      ))}
                    </Suggestions>
                  </div>
                </ConversationEmptyState>
              ) : (
                messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {part.text}
                              </Response>
                            )
                          default:
                            return null
                        }
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <Input
            onSubmit={handleSubmit}
            className="mt-4 w-full max-w-2xl mx-auto relative"
          >
            <PromptInputTextarea
              value={input}
              placeholder="Say something..."
              onChange={(e) => setInput(e.currentTarget.value)}
              className="pr-12"
            />
            <PromptInputSubmit
              status={status === "streaming" ? "streaming" : "ready"}
              disabled={!input.trim()}
              className="absolute bottom-1 right-1"
            />
          </Input>
        </div>
      </div>
    </div>
  )
}
