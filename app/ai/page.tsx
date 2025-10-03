"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"
import { useRef, useEffect } from "react"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = [
    "Explain quantum computing in simple terms",
    "Write a haiku about coding",
    "What are the best practices for React?",
    "Help me debug a JavaScript error",
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const input = formData.get("message") as string

    if (input.trim()) {
      sendMessage({ text: input })
      e.currentTarget.reset()
      inputRef.current?.focus()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion })
    inputRef.current?.focus()
  }

  return (
    <div className="p-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
      </div>

      <Card className="flex flex-col w-full h-[calc(100vh-8rem)] shadow-lg">

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-12 h-12 mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
              <p className="text-muted-foreground mb-6">Ask me anything and I'll help you out!</p>

              <div className="w-full max-w-md">
                <p className="text-sm font-medium text-muted-foreground mb-3">Try asking:</p>
                <Suggestions>
                  {suggestions.map((suggestion, index) => (
                    <Suggestion key={index} suggestion={suggestion} onClick={handleSuggestionClick} />
                  ))}
                </Suggestions>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <p key={index} className="whitespace-pre-wrap leading-relaxed">
                        {part.text}
                      </p>
                    )
                  }
                  return null
                })}
              </div>

              {message.role === "user" && (
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground">
                    <User className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {status === "in_progress" && (
            <div className="flex gap-3 justify-start">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-muted/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              name="message"
              placeholder="Type your message..."
              disabled={status === "in_progress"}
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" disabled={status === "in_progress"} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
