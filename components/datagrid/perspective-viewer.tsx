"use client"

import { useEffect, useRef, useState } from "react"

export interface PerspectiveViewerProps {
  data?: any[]
  columns?: string[]
  theme?: "pro" | "pro-dark" | "material" | "material-dark" | "vaporwave"
  view?: "datagrid" | "d3fc-xy-scatter" | "d3fc-xy-line" | "d3fc-xy-area" | "d3fc-xy-bar" | "d3fc-sunburst" | "d3fc-treemap" | "d3fc-heatmap"
  aggregates?: Record<string, string>
  sort?: string[][]
  filter?: any[][]
  expressions?: string[]
  group_by?: string[]
  split_by?: string[]
  title?: string
  settings?: boolean
  className?: string
}

export function PerspectiveViewer({
  data = [],
  columns,
  theme = "pro-dark",
  view = "datagrid",
  aggregates,
  sort,
  filter,
  expressions,
  group_by,
  split_by,
  title,
  settings = true,
  className = "",
}: PerspectiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let viewer: any = null
    let cleanup = false

    const loadPerspective = async () => {
      if (!containerRef.current || typeof window === "undefined") return

      try {
        setIsLoading(true)
        setError(null)

        // Load Perspective from CDN
        const script = document.createElement("script")
        script.type = "module"
        script.textContent = `
          import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective@2.10.1/dist/cdn/perspective.js";
          import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@2.10.1/dist/cdn/perspective-viewer.js";
          import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@2.10.1/dist/cdn/perspective-viewer-datagrid.js";
          import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@2.10.1/dist/cdn/perspective-viewer-d3fc.js";
          window.perspective = perspective;
        `

        // Add CSS
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@2.10.1/dist/css/themes.css"
        document.head.appendChild(link)

        document.head.appendChild(script)

        // Wait for perspective to be available
        let attempts = 0
        while (!customElements.get("perspective-viewer") && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (cleanup) return

        if (!customElements.get("perspective-viewer")) {
          throw new Error("Failed to load Perspective viewer")
        }

        // Create viewer element
        viewer = document.createElement("perspective-viewer") as any
        viewerRef.current = viewer

        // Set attributes
        viewer.setAttribute("theme", theme)

        if (!settings) {
          viewer.setAttribute("settings", "false")
        }

        if (title) {
          viewer.setAttribute("title", title)
        }

        // Style the viewer
        viewer.style.width = "100%"
        viewer.style.height = "100%"

        // Clear container and append viewer
        if (containerRef.current) {
          containerRef.current.innerHTML = ""
          containerRef.current.appendChild(viewer)
        }

        // Load data if available
        if (data && data.length > 0 && (window as any).perspective) {
          const perspective = (window as any).perspective
          const worker = await perspective.worker()
          const table = await worker.table(data)
          await viewer.load(table)

          // Configure the view
          const config: any = {}

          if (view) {
            config.plugin = view
          }

          if (columns && columns.length > 0) {
            config.columns = columns
          }

          if (aggregates) {
            config.aggregates = aggregates
          }

          if (sort) {
            config.sort = sort
          }

          if (filter) {
            config.filter = filter
          }

          if (expressions) {
            config.expressions = expressions
          }

          if (group_by && group_by.length > 0) {
            config.group_by = group_by
          }

          if (split_by && split_by.length > 0) {
            config.split_by = split_by
          }

          // Apply configuration
          await viewer.restore(config)
        }
      } catch (error) {
        console.error("Error initializing Perspective viewer:", error)
        setError(error instanceof Error ? error.message : "Failed to load Perspective viewer")
      } finally {
        if (!cleanup) {
          setIsLoading(false)
        }
      }
    }

    loadPerspective()

    return () => {
      cleanup = true

      // Cleanup
      if (viewer) {
        try {
          viewer.delete?.()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, []) // Only run once on mount

  // Update data when it changes
  useEffect(() => {
    if (viewerRef.current && data && data.length > 0 && (window as any).perspective) {
      const updateData = async () => {
        try {
          const perspective = (window as any).perspective
          const worker = await perspective.worker()
          const table = await worker.table(data)
          await viewerRef.current.load(table)
        } catch (error) {
          console.error("Error updating data:", error)
        }
      }
      updateData()
    }
  }, [data])

  if (error) {
    return (
      <div className={`flex items-center justify-center w-full h-full min-h-[500px] ${className}`}>
        <div className="text-center">
          <p className="text-red-500">Error loading data grid</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full min-h-[500px] ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading data grid...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}