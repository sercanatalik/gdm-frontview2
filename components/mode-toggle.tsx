"use client"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>
          <Button
            className="w-8 h-8 bg-background mr-2"
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Moon className="w-[1.2rem] h-[1.2rem] rotate-90 scale-0 transition-transform ease-in-out duration-500 dark:rotate-0 dark:scale-100" />
            <Sun className="absolute w-[1.2rem] h-[1.2rem] rotate-0 scale-100 transition-transform ease-in-out duration-500 dark:-rotate-90 dark:scale-0" />
            <span className="sr-only">Switch Theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Switch Theme</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
