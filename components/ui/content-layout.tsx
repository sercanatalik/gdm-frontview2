import type React from "react"
import { Navbar } from "./navbar"
interface ContentLayoutProps {
  title: string
  children: React.ReactNode
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div className="h-full flex flex-col">
      {/* <Navbar title={title} /> */}
      <div className="container-fluid pt-4 pb-4 px-4">{children}</div>
    </div>
  )
}

