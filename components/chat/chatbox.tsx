"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send, X } from "lucide-react"

type Assistant = "GDM Pricer" | "GDM Financing" | "GDM News"

type Message = {
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

function useStreamSimulation(text: string, delay = 50) {
  const [streamedText, setStreamedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let i = 0
    setIsComplete(false)
    const intervalId = setInterval(() => {
      setStreamedText((current) => {
        if (i < text.length) {
          i++
          return text.slice(0, i)
        } else {
          clearInterval(intervalId)
          setIsComplete(true)
          return current
        }
      })
    }, delay)

    return () => clearInterval(intervalId)
  }, [text, delay])

  return { streamedText, isComplete }
}

interface ChatboxProps {
  onClose: () => void
}

const Chatbox: React.FC<ChatboxProps> = ({ onClose }) => {
  const [isChatboxOpen, setIsChatboxOpen] = useState(false)
  const [currentAssistant, setCurrentAssistant] = useState<Assistant>("GDM Pricer")
  const [input, setInput] = useState("")
  const [chats, setChats] = useState<Record<Assistant, Message[]>>({
    "GDM Pricer": [
      { role: "assistant", content: "Hello! I'm the GDM Pricer assistant. How can I help you with pricing today?" },
    ],
    "GDM Financing": [
      { role: "assistant", content: "Welcome! I'm the GDM Financing assistant. How can I assist you with financing?" },
    ],
    "GDM News": [
      { role: "assistant", content: "Hello! I'm the GDM News assistant. How can I help you with news today?" },
    ],
  })
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null)

  const { streamedText, isComplete } = useStreamSimulation(streamingMessage ? streamingMessage.content : "", 30)

  const toggleChatbox = () => {
    setIsChatboxOpen(!isChatboxOpen)
  }

  const handleSend = useCallback(() => {
    if (input.trim()) {
      const newMessage: Message = { role: "user", content: input.trim() }
      setChats((prevChats) => ({
        ...prevChats,
        [currentAssistant]: [...prevChats[currentAssistant], newMessage],
      }))
      setInput("")

      // Simulate API call and response streaming
      setTimeout(() => {
        const assistantResponse: Message = {
          role: "assistant",
          content: `This is a simulated streaming response from ${currentAssistant} to "${input.trim()}". It will appear gradually to mimic a real-time response.`,
          isStreaming: true,
        }
        setStreamingMessage(assistantResponse)
      }, 500)
    }
  }, [input, currentAssistant])

  useEffect(() => {
    if (isComplete && streamingMessage) {
      setChats((prevChats) => ({
        ...prevChats,
        [currentAssistant]: [...prevChats[currentAssistant], { ...streamingMessage, isStreaming: false }],
      }))
      setStreamingMessage(null)
    }
  }, [isComplete, streamingMessage, currentAssistant])

  const handleAssistantChange = (value: Assistant) => {
    setCurrentAssistant(value)
  }

  return (
    <>
      {isChatboxOpen ? (
        <div className="fixed bottom-4 right-4 w-full sm:w-96 h-[60vh] z-50">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">AI Chat</CardTitle>
              <Button variant="ghost" size="sm" onClick={toggleChatbox}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-4 space-y-4">
              <Select onValueChange={handleAssistantChange} defaultValue={currentAssistant}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select an assistant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GDM Pricer">GDM Pricer</SelectItem>
                  <SelectItem value="GDM Financing">GDM Financing Exposure</SelectItem>
                  <SelectItem value="GDM News">GDM News</SelectItem>
                </SelectContent>
              </Select>
              <ScrollArea className="flex-grow pr-4">
                <div className="space-y-4">
                  {chats[currentAssistant].map((message, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg ${message.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"}`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
                  {streamingMessage && (
                    <div className="p-2 rounded-lg bg-muted">
                      <p className="text-sm">{streamedText}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-center">
                <Input
                  placeholder="Type your message..."
                  className="flex-grow text-sm py-2"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                />
                <Button size="sm" className="ml-2" onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Button className="fixed bottom-4 right-4 z-50" onClick={toggleChatbox}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Open Chat
        </Button>
      )}
    </>
  )
}

export default Chatbox

