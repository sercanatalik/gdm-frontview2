# Sidebar System — Recreation Guide

Complete instructions for building a config-driven, collapsible sidebar with team/workspace switching, responsive mobile drawer, theme-aware branding, and a header with breadcrumbs in any Next.js + shadcn/ui project. All navigation items, teams, and icons are defined in a single config file — zero component changes needed when the data model changes.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  <html>                                                         │
│  <body>                                                         │
│    <Providers>               ← React Query                     │
│      <ThemeProvider>         ← next-themes (light/dark/system) │
│        <SidebarProvider>     ← Sidebar context + cookie state  │
│        ┌────────┬──────────────────────────────────────────┐   │
│        │Sidebar │  SidebarInset (main content area)        │   │
│        │        │  ┌──────────────────────────────────┐    │   │
│        │ Header │  │ Header (trigger + breadcrumb)    │    │   │
│        │ (logo  │  ├──────────────────────────────────┤    │   │
│        │  team  │  │ Separator                        │    │   │
│        │  menu) │  ├──────────────────────────────────┤    │   │
│        │        │  │                                  │    │   │
│        │ Nav    │  │ {children} (page content)        │    │   │
│        │ Items  │  │                                  │    │   │
│        │        │  │                                  │    │   │
│        └────────┴──┴──────────────────────────────────┘    │   │
│        </SidebarProvider>                                      │
│      </ThemeProvider>                                          │
│    </Providers>                                                │
│  </body>                                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Desktop:** Fixed sidebar (14rem expanded, 3.2rem collapsed as icon-only)
**Mobile (<768px):** Sheet/drawer overlay (19rem wide)

---

## Prerequisites

### Dependencies

```bash
npm install next-themes @tanstack/react-query lucide-react
```

### Required shadcn/ui Components

```bash
npx shadcn@latest add sidebar button dropdown-menu breadcrumb separator tooltip avatar sheet skeleton
```

The `sidebar` command installs the full sidebar component library (25+ components) plus the `use-mobile` hook.

### Utility

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## File Structure

```
app/
  layout.tsx              ← Root layout (provider hierarchy + sidebar shell)
  globals.css             ← CSS variables (sidebar theme colors)

components/
  app-sidebar.tsx         ← Application sidebar (team switcher + nav items)
  header.tsx              ← Top header (sidebar trigger + breadcrumb + user menu)
  theme-provider.tsx      ← next-themes wrapper
  providers.tsx           ← React Query provider
  mode-toggle.tsx         ← Light/dark theme toggle button
  ui/
    sidebar.tsx           ← Base sidebar primitives (25 components)
    user-nav.tsx          ← User profile dropdown
    breadcrumb.tsx        ← Breadcrumb components
    ...                   ← Other shadcn components

hooks/
  use-mobile.ts           ← Mobile breakpoint detection hook

lib/
  menu-items.ts           ← Navigation config (teams + items per team)
  utils.ts                ← cn() utility
```

---

## Step 1: Mobile Detection Hook

Create `hooks/use-mobile.ts`. Used by the sidebar to switch between fixed sidebar and sheet drawer.

```ts
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile(defaultState = false) {
  const [isMobile, setIsMobile] = React.useState(defaultState)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
```

---

## Step 2: Sidebar Primitive Component

Install via `npx shadcn@latest add sidebar` or create `components/ui/sidebar.tsx` manually. This is a 725-line component library providing 25 exports. Key details:

### Constants

```ts
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  // 7-day persistence
const SIDEBAR_WIDTH = "14rem"                      // 224px expanded
const SIDEBAR_WIDTH_MOBILE = "19rem"               // 304px mobile drawer
const SIDEBAR_WIDTH_ICON = "3.2rem"                // ~51px collapsed
const SIDEBAR_KEYBOARD_SHORTCUT = "b"              // Ctrl/Cmd+B toggle
```

### Context

```ts
type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}
```

### Component Exports (25 total)

| Component | HTML | Purpose |
|---|---|---|
| **SidebarProvider** | `<div>` | Context wrapper, cookie persistence, keyboard shortcut, wraps `TooltipProvider` |
| **Sidebar** | `<div>` or `<Sheet>` | Main container — fixed sidebar on desktop, Sheet on mobile |
| **SidebarInset** | `<main>` | Content area beside the sidebar |
| **SidebarTrigger** | `<Button>` | Toggle button with `PanelLeftIcon` |
| **SidebarRail** | `<button>` | Invisible edge handle to toggle |
| **SidebarHeader** | `<div>` | Top section (logo/team switcher) |
| **SidebarFooter** | `<div>` | Bottom section (user profile, etc.) |
| **SidebarContent** | `<div>` | Scrollable nav content area |
| **SidebarSeparator** | `<Separator>` | Visual divider |
| **SidebarInput** | `<Input>` | Search input |
| **SidebarGroup** | `<div>` | Group container with padding |
| **SidebarGroupLabel** | `<div>` | Group heading (hides when collapsed) |
| **SidebarGroupAction** | `<button>` | Group-level action button |
| **SidebarGroupContent** | `<div>` | Group items wrapper |
| **SidebarMenu** | `<ul>` | Menu list |
| **SidebarMenuItem** | `<li>` | Menu item |
| **SidebarMenuButton** | `<button>` | Nav button with `isActive`, `tooltip`, `variant`, `size` props |
| **SidebarMenuAction** | `<button>` | Secondary action in menu item |
| **SidebarMenuBadge** | `<div>` | Badge/notification counter |
| **SidebarMenuSkeleton** | `<div>` | Loading placeholder |
| **SidebarMenuSub** | `<ul>` | Nested submenu (left-bordered) |
| **SidebarMenuSubItem** | `<li>` | Submenu item |
| **SidebarMenuSubButton** | `<a>` | Submenu link |
| **useSidebar** | hook | Access sidebar context |

### Sidebar Props

```ts
interface SidebarProps {
  side?: "left" | "right"                         // Default: "left"
  variant?: "sidebar" | "floating" | "inset"      // Default: "sidebar"
  collapsible?: "offcanvas" | "icon" | "none"     // Default: "offcanvas"
}
```

**Collapsible modes:**
- `"icon"` — Collapses to icon-only strip (used in this project)
- `"offcanvas"` — Slides fully off-screen
- `"none"` — Always expanded, no collapse

### SidebarMenuButton Variants (CVA)

```ts
variants: {
  variant: {
    default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    outline: "bg-background shadow-[...] hover:bg-sidebar-accent",
  },
  size: {
    default: "h-8 text-sm",
    sm: "h-7 text-xs",
    lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
  },
}
```

Active state styling: `data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium`

### Tooltip Behavior

When sidebar is collapsed on desktop, `SidebarMenuButton` shows a tooltip on hover (via `tooltip` prop). Tooltips are hidden when expanded or on mobile.

### State Persistence

Open/closed state is saved to a `sidebar_state` cookie with 7-day expiry. Restored on page reload.

### Keyboard Shortcut

`Ctrl+B` (Windows/Linux) or `Cmd+B` (Mac) toggles the sidebar.

### Data Attributes

The component system uses data attributes for CSS targeting:
- `data-state="expanded" | "collapsed"`
- `data-collapsible="icon" | "offcanvas" | ""`
- `data-variant="sidebar" | "floating" | "inset"`
- `data-side="left" | "right"`
- `data-active="true" | "false"`
- `data-size="sm" | "default" | "lg"`
- `data-mobile="true"` (mobile sheet mode)
- `data-slot="sidebar-*"` (component identification)

These enable Tailwind group selectors like `group-data-[collapsible=icon]:hidden`.

---

## Step 3: CSS Variables (Sidebar Theme)

Add to `app/globals.css`. The sidebar has its own color palette separate from the main theme.

```css
@theme inline {
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

/* Light theme */
:root {
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

/* Dark theme */
.dark {
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.439 0 0);
}
```

### Optional: Collapsed State Color Inversion

To make the collapsed icon strip visually distinct (dark when light theme, light when dark theme):

```css
/* Collapsed sidebar: invert colors for contrast */
[data-slot="sidebar"][data-state="collapsed"] {
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(13.698% 0.02067 271.873);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

.dark [data-slot="sidebar"][data-state="collapsed"] {
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}
```

---

## Step 4: Navigation Configuration (Data-Model-Independent)

Create `lib/menu-items.ts`. This is the **only file that changes** when you add teams, pages, or restructure navigation.

### Type Definitions

```ts
import { type ElementType } from "react"

export interface Team {
  name: string           // Display name
  plan: string           // Subtitle text shown below the name
  icon: ElementType      // Lucide icon component (not an instance, the component type)
  route: string          // Route to navigate on team select
}

export interface NavItem {
  title: string          // Display label
  url: string            // Next.js route path
  icon: ElementType      // Lucide icon component
}
```

### Example Configuration

```ts
import { Globe, CreditCard, DollarSign, Home, Table } from "lucide-react"

// Teams / workspaces shown in the header dropdown
export const teams: Team[] = [
  {
    name: "Financing",
    plan: "Financing",
    icon: Globe,
    route: "/financing",
  },
  {
    name: "Structured Credit",
    plan: "Structured Credit",
    icon: CreditCard,
    route: "/credit",
  },
  {
    name: "AI SDK Client",
    plan: "AI SDK Client",
    icon: DollarSign,
    route: "/ai",
  },
]

// Navigation items per team
// Key = team name, Value = NavItem[]
export const teamNavItems: Record<string, NavItem[]> = {
  "Financing": [
    { title: "Dashboard", url: "/financing", icon: Home },
    { title: "Data Grid", url: "/datagrid", icon: Table },
  ],
  "Structured Credit": [
    { title: "Exposure 4T", url: "/credit/exposure", icon: Home },
    { title: "Settings", url: "/credit/settings", icon: Table },
  ],
  // Teams with no items will show an empty nav
}
```

### Adding New Teams/Pages

1. Add a team object to the `teams` array
2. Add navigation items to `teamNavItems` under the team name
3. No component code changes needed

---

## Step 5: Theme Provider

Create `components/theme-provider.tsx`. Thin wrapper around `next-themes`.

```tsx
'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

---

## Step 6: React Query Provider

Create `components/providers.tsx`.

```tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 3 * 60 * 1000,        // 3 minutes
        gcTime: 15 * 60 * 1000,           // 15 minutes
        retry: 4,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

---

## Step 7: Mode Toggle (Theme Switcher)

Create `components/mode-toggle.tsx`. Button with animated Sun/Moon icons.

```tsx
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
```

---

## Step 8: User Navigation Dropdown

Create `components/ui/user-nav.tsx`. Profile avatar with dropdown menu.

```tsx
"use client"

import Link from "next/link"
import { LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button className="w-8 h-8 bg-background mr-2" variant="outline">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="#" alt="Avatar" />
                  <AvatarFallback className="bg-transparent">SA</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">User Name</p>
            <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/admin/" className="flex items-center">
              <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
              Admin
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:cursor-pointer" asChild>
          <Link href="/logout" className="flex items-center">
            <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
            Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## Step 9: Header Component

Create `components/header.tsx`. Contains the sidebar trigger, breadcrumbs, theme toggle, and user menu.

```tsx
"use client"
import Link from "next/link"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList,
  BreadcrumbLink, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/ui/user-nav"

export function Header() {
  const pathname = usePathname()
  const title = pathname.split("/").pop()?.replace("-", " ") || "Home"

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2 bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="capitalize">{title}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-0">
        <ModeToggle />
        <UserNav />
      </div>
    </div>
  )
}
```

### Breadcrumb Logic

The current page title is derived from the URL pathname:
- `/financing` → "financing"
- `/datagrid` → "datagrid"
- `/credit/exposure` → "exposure"

Hyphens are replaced with spaces and the result is capitalized.

---

## Step 10: App Sidebar Component

Create `components/app-sidebar.tsx`. This is the application-specific sidebar that uses the primitive components and reads from the navigation config.

### Structure

```
Sidebar (collapsible="icon")
├── SidebarHeader
│   └── SidebarMenu
│       └── SidebarMenuItem
│           └── DropdownMenu (team/workspace switcher)
│               ├── Trigger: Logo + App Name + Team Plan + ChevronsUpDown
│               └── Content: List of teams
└── SidebarContent
    └── SidebarGroup
        ├── SidebarGroupLabel ("Navigation")
        └── SidebarGroupContent
            └── SidebarMenu
                └── SidebarMenuItem * N (nav items for active team)
                    └── SidebarMenuButton (asChild + tooltip)
                        └── Link (Next.js client-side navigation)
                            ├── <item.icon />
                            └── <span>{item.title}</span>
```

### Full Implementation

```tsx
"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ChevronsUpDown } from "lucide-react"

import { teams, teamNavItems } from "@/lib/menu-items"

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "./ui/sidebar"

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useTheme()
  const { state } = useSidebar()

  const [activeTeam, setActiveTeam] = useState(teams[0])
  const [items, setItems] = useState<typeof teamNavItems[string]>([])
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch for theme-dependent rendering
  useEffect(() => { setMounted(true) }, [])

  // Sync active team with URL path (handles browser back/forward)
  useEffect(() => {
    const currentTeam = teams.find((team) => team.route === pathname)
    if (currentTeam) setActiveTeam(currentTeam)
  }, [pathname])

  // Update nav items when active team changes
  useEffect(() => {
    setItems(teamNavItems[activeTeam.name] || [])
  }, [activeTeam])

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: Logo + Team Switcher ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent border-none shadow-none"
                >
                  {/* Logo — theme-aware, size changes on collapse */}
                  {mounted && state === "expanded" && (
                    <div className="flex aspect-square size-10 items-center justify-center">
                      <Image
                        src={theme === "light" ? "/logo-light.svg" : "/logo-dark.svg"}
                        alt="Logo"
                        width={32}
                        height={32}
                        priority
                      />
                    </div>
                  )}
                  {mounted && state === "collapsed" && (
                    <div className="flex aspect-square size-9 items-center justify-center">
                      <Image
                        src={theme === "light" ? "/logo-dark.svg" : "/logo-light.svg"}
                        alt="Logo"
                        width={28}
                        height={28}
                        priority
                      />
                    </div>
                  )}

                  {/* App name + team subtitle */}
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:-ml-1">
                    <span className="truncate font-semibold">My App</span>
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
                {teams.map((team) => (
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

      {/* ── Content: Navigation Items ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url} className="flex w-full items-center gap-2">
                      <item.icon className="size-4" />
                      <span className="truncate">{item.title}</span>
                    </Link>
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
```

### Key Behaviors

**Team switching:**
1. User clicks the header dropdown
2. Selects a team → `setActiveTeam(team)` + `router.push(team.route)`
3. `useEffect` detects `activeTeam` change → updates `items` from config
4. Navigation re-renders with new items

**URL sync:**
- `usePathname()` watches for route changes (including browser back/forward)
- Matches against `teams[].route` to keep the active team indicator correct

**Hydration safety:**
- `mounted` state prevents rendering theme-dependent content (logos) during SSR
- Theme-dependent rendering is gated behind `mounted && state === "expanded|collapsed"`

**Logo contrast on collapse:**
- When expanded: uses the logo matching the current theme
- When collapsed: uses the **inverted** logo (because collapsed state has inverted colors)

**Tooltips on collapse:**
- `tooltip={item.title}` on `SidebarMenuButton` shows the item name on hover when sidebar is collapsed to icons

---

## Step 11: Root Layout

Create `app/layout.tsx`. Establishes the provider hierarchy and sidebar shell.

```tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/components/providers"
import { Header } from "@/components/header"
import { Separator } from "@/components/ui/separator"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "My App",
  description: "Description here",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
              <SidebarInset className="flex flex-col h-screen">
                <main className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <Separator orientation="horizontal" className="my-1" />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="container-fluid h-full pt-4 pb-4 px-4">
                      {children}
                    </div>
                  </div>
                </main>
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
```

### Provider Order (inside → outside)

1. **Providers** (React Query) — outermost, data-fetching infrastructure
2. **ThemeProvider** (next-themes) — light/dark/system theme
3. **SidebarProvider** — sidebar state context, cookie persistence, keyboard shortcut

`SidebarProvider defaultOpen={false}` starts with the sidebar collapsed on initial load.

### Layout Structure

```
SidebarProvider
├── AppSidebar          ← Fixed left (desktop) or sheet (mobile)
└── SidebarInset        ← Main content takes remaining width
    └── main
        ├── Header      ← Trigger + breadcrumb + theme + user
        ├── Separator
        └── div         ← Scrollable page content
            └── {children}
```

---

## Adding New Teams & Pages (Checklist)

1. **Add team to `lib/menu-items.ts`:**
   ```ts
   { name: "Analytics", plan: "Analytics", icon: BarChart, route: "/analytics" }
   ```

2. **Add nav items for the team:**
   ```ts
   "Analytics": [
     { title: "Overview", url: "/analytics", icon: Home },
     { title: "Reports", url: "/analytics/reports", icon: FileText },
   ]
   ```

3. **Create the page:** `app/analytics/page.tsx`

No component code changes. The sidebar automatically picks up new teams and items from the config.

---

## Optional Enhancements

### Active Link Highlighting

Add `isActive` to `SidebarMenuButton` based on current pathname:

```tsx
<SidebarMenuButton
  asChild
  tooltip={item.title}
  isActive={pathname === item.url}
>
```

### Footer Section (User Profile in Sidebar)

```tsx
<SidebarFooter>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip="Settings">
        <Link href="/settings">
          <Settings className="size-4" />
          <span>Settings</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
```

### Nested Submenus

```tsx
<SidebarMenuItem>
  <SidebarMenuButton>
    <FolderIcon className="size-4" />
    <span>Reports</span>
  </SidebarMenuButton>
  <SidebarMenuSub>
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={pathname === "/reports/daily"}>
        <Link href="/reports/daily">Daily</Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <Link href="/reports/weekly">Weekly</Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  </SidebarMenuSub>
</SidebarMenuItem>
```

### Badge / Notification Count

```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <Link href="/inbox"><Inbox className="size-4" /><span>Inbox</span></Link>
  </SidebarMenuButton>
  <SidebarMenuBadge>24</SidebarMenuBadge>
</SidebarMenuItem>
```

---

## Key Design Decisions

1. **Config-driven navigation**: All teams, routes, items, and icons live in `lib/menu-items.ts`. Adding or removing pages requires zero component changes.

2. **Icon-collapsible mode**: The sidebar collapses to a narrow icon strip rather than disappearing entirely, keeping navigation always accessible.

3. **Cookie-based persistence**: Sidebar open/closed state survives page reloads via a 7-day browser cookie — no database or localStorage needed.

4. **Theme-aware branding**: Logo swaps based on both theme (light/dark) and sidebar state (expanded/collapsed with inverted colors).

5. **Mobile-first responsive**: Automatically switches from fixed sidebar to sheet/drawer overlay below 768px breakpoint.

6. **Hydration-safe**: Theme-dependent content (logos) is gated behind a `mounted` flag to prevent SSR/client mismatch.

7. **Keyboard accessible**: `Ctrl/Cmd+B` toggle, tab navigation, ARIA labels, screen-reader text for icon-only elements.

8. **Data-attribute styling**: Uses `data-state`, `data-collapsible`, `data-variant` attributes with Tailwind `group-data-[*]` selectors for clean responsive styling without JS.
