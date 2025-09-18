"use client"

import { useEffect, useRef, useState } from "react"

export interface PerspectiveViewerProps {
  data?: any[]
  theme?: "pro-dark" | "pro" | "material" | "material-dark"
  view?: "datagrid" | "d3fc-xy-scatter" | "d3fc-xy-line" | "d3fc-xy-bar"
  className?: string
}

let perspectiveLoaded = false

export function PerspectiveViewer({
  data = [],
  theme = "pro-dark",
  view = "datagrid",
  className = "",
}: PerspectiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAndInitialize = async () => {
      if (!containerRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        // Load Perspective only once
        if (!perspectiveLoaded) {
          // Add CSS
          if (!document.querySelector('link[href*="perspective-viewer"]')) {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href = "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@2.10.1/dist/css/themes.css"
            document.head.appendChild(link)
          }

          // Load modules
          if (!document.querySelector('script[data-perspective]')) {
            const script = document.createElement("script")
            script.setAttribute("data-perspective", "true")
            script.type = "module"
            script.innerHTML = `
              import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective@2.10.1/dist/cdn/perspective.js";
              import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@2.10.1/dist/cdn/perspective-viewer.js";
              import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@2.10.1/dist/cdn/perspective-viewer-datagrid.js";
              import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@2.10.1/dist/cdn/perspective-viewer-d3fc.js";
              window.perspective = perspective;
              window.perspectiveReady = true;
            `
            document.head.appendChild(script)
          }

          // Wait for perspective to load
          let attempts = 0
          while (!(window as any).perspectiveReady && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }

          if (!(window as any).perspectiveReady) {
            throw new Error("Failed to load Perspective")
          }

          perspectiveLoaded = true
        }

        // Wait for custom element to be defined
        await customElements.whenDefined("perspective-viewer")

        // Create and configure viewer
        const viewer = document.createElement("perspective-viewer") as any
        viewer.setAttribute("theme", theme)
        viewer.style.width = "100%"
        viewer.style.height = "100%"

        // Clear container and add viewer
        containerRef.current.innerHTML = ""
        containerRef.current.appendChild(viewer)

        // Load data if available
        if (data && data.length > 0) {
          const perspective = (window as any).perspective
          const worker = await perspective.worker()
          const table = await worker.table(data)
          await viewer.load(table)

          // Set view type
          if (view !== "datagrid") {
            await viewer.restore({ plugin: view })
          }
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Perspective error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize")
        setIsLoading(false)
      }
    }

    loadAndInitialize()
  }, [data, theme, view])

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center p-4">
          <div className="text-red-500 font-medium">Failed to load data grid</div>
          <div className="text-sm text-muted-foreground mt-1">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading grid...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}