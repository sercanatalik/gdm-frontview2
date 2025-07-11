"use client"
import { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
// import { UserNav } from "@/components/admin-panel/user-nav"
// import { SheetMenu } from "@/components/admin-panel/sheet-menu"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import Chatbox from "@/components/chat/chatbox"

interface NavbarProps {
  title: string
}

export function Navbar({ title }: NavbarProps) {
  const [isChatboxOpen, setIsChatboxOpen] = useState(false)

  const toggleChatbox = () => {
    setIsChatboxOpen(!isChatboxOpen)
  }

  return (
    <>
      <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
        <div className="mx-4 sm:mx-8 flex h-14 items-center">
          <div className="flex items-center space-x-4 lg:space-x-0">
        
            {/* <h1 className="font-bold">{title}</h1> */}
        
          </div>
          <div className="flex flex-1 items-center justify-end">
            <Button
              onClick={toggleChatbox}
              variant="outline"
              size="icon"
              className="rounded-full w-8 h-8 bg-background mr-2"
            >
              <MessageCircle className="ml-1 h-4 w-4" />
            </Button>
            {/* <ModeToggle /> */}
            
            {/* <UserNav /> */}
          </div>
        </div>
      </header>
      {isChatboxOpen && <Chatbox onClose={() => setIsChatboxOpen(false)} />}
    </>
  )
}

