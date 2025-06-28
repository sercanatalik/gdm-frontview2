"use client"

import * as React from "react"
import { useState } from "react"
import Image from "next/image"
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { Globe, File } from "lucide-react"
import hsbcLight from "@/public/hsbc-light.svg"
import hsbcDark from "@/public/hsbc-dark.svg"

const teams = [
  {
    name: "Financing",
    plan: "Financing",
    icon: Globe,
  },
  {
    name: "Structured Credit",
    plan: "Structured Credit",
    icon: File,
  },
]

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]



export function AppSidebar() {
  const [activeTeam, setActiveTeam] = useState(teams[0])
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
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {state === "expanded" && (
                    <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Image
                        src={theme === "light" ? hsbcLight : hsbcDark}
                        alt="HSBC Logo"
                        className="size-8"
                      />
                    </div>
                  )}
                   {state === "collapsed" && (
                      <Image
                        src={theme === "light" ? hsbcLight : hsbcDark}
                        alt="HSBC Logo"
                        className="size-7"
                      />
                  
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
                    onClick={() => setActiveTeam(team)}
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