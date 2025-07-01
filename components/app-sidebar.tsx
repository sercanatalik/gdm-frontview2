"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Calendar,
  ChevronsUpDown,
  Home,
  Inbox,
  Plus,
  Search,
  Settings,
} from "lucide-react"

import { creditItems,financingItems, teams } from "@/lib/menu-items"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar"
export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTeam, setActiveTeam] = useState(teams[0])
  const [items, setItems] = useState<{ title: string; url: string; icon: React.ElementType }[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Effect to sync the active team with the URL path when it changes.
  // This handles cases like using the browser's back/forward buttons.
  useEffect(() => {
    const currentTeam = teams.find((team) => team.route === pathname)
    if (currentTeam) {
      setActiveTeam(currentTeam)

    }
  }, [pathname])

  useEffect(() => {
    if (activeTeam.name === "Financing") {
      setItems(financingItems)
    } else if (activeTeam.name === "Structured Credit") {
      setItems(creditItems)
    } else {
      setItems([])
    }
  }, [activeTeam])
  const { theme } = useTheme()
  const { state } = useSidebar()
 

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    "bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent border-none shadow-none"
                  )}
                >
                  {mounted && state === "expanded" && (
                    <div className="flex aspect-square size-10 items-center justify-center ">
                      <Image
                        src={
                          theme === "light"
                            ? "/hsbc-light.svg"
                            : "/hsbc-dark.svg"
                        }
                        alt="HSBC Logo"
                        width={32}
                        height={32}
                        priority
                      />
                    </div>
                  )}
                  {mounted && state === "collapsed" && (
                    <div className="flex aspect-square size-9 items-center justify-center ">
                    <Image
                      src={
                        theme === "light"
                          ? "/hsbc-dark.svg"
                          : "/hsbc-light.svg"
                      }
                      alt="HSBC Logo"
                      width={28}
                      height={28}
                      priority
                    />
                    </div>
                  )}


                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:-ml-1">
                    <span className="truncate font-semibold">
                      GDM FrontView
                    </span>
                    <span className="truncate text-xs">{activeTeam.plan}</span>
                  </div>
                 
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                 Teams
                </DropdownMenuLabel>
                {teams.map((team, index) => (
                  <DropdownMenuItem
                    key={team.name}
                    onClick={() => {
                      setActiveTeam(team)
                      router.push(team.route)
                    }}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <team.icon className="size-4 shrink-0" />
                    </div>
                    {team.name}
                  
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                  >
                    <a
                      href={item.url}
                      className="flex w-full items-center gap-2"
                    >
                      <item.icon className="size-4" />
                      <span className="truncate">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}