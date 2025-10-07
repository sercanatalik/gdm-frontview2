import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";

import { Header } from "@/components/header";
import { Separator } from "@/components/ui/separator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "GDM Frontview",
  description: "intuitive and powerful frontend solution",
    generator: 'v0.dev'
}



export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
    
          >
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
  );
}
