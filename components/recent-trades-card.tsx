"use client"

import React, { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Download, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRecentTrades, useTradesMaturingSoon, type Trade } from "@/lib/query/recent-trades"
import html2canvas from 'html2canvas-pro'
import * as FileSaver from "file-saver"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RecentTradesCardProps {
  filters?: any[]
  className?: string
  asOfDate?: string
}

const ITEMS_PER_PAGE = 10

export function RecentTradesCard({ filters = [], className, asOfDate }: RecentTradesCardProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState("recent")
  
  const { data: recentTrades = [], isLoading: isLoadingRecent, error: errorRecent } = useRecentTrades(filters, 100, asOfDate)
  const { data: maturingTrades = [], isLoading: isLoadingMaturing, error: errorMaturing } = useTradesMaturingSoon(filters, 100, asOfDate)
  
  const cardRef = useRef<HTMLDivElement>(null)

  const trades = activeTab === "recent" ? recentTrades : maturingTrades
  const isLoading = activeTab === "recent" ? isLoadingRecent : isLoadingMaturing
  const error = activeTab === "recent" ? errorRecent : errorMaturing

  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE)
  const startIndex = currentPage * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentTrades = trades.slice(startIndex, endIndex)


  const formatCurrency = (value: number) => {
    const millions = value / 1000000
    return `${millions >= 0 ? '+' : ''}${millions.toFixed(2)} mio`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  const getInitials = (counterparty: string) => {
    return counterparty
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 3)
      .toUpperCase()
  }

  const getTotalStats = () => {
    const tradeCount = trades.length
    const counterparties = new Set(trades.map(t => t.counterparty)).size
    const instruments = new Set(trades.map(t => t.instrument)).size
    const currencies = new Set(trades.map(t => t.instrument.split('_')[0])).size

    return { tradeCount, counterparties, instruments, currencies }
  }

  const stats = getTotalStats()

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(0) // Reset pagination when switching tabs
  }

  const handleExportPNG = useCallback(async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false
      })
      
      canvas.toBlob((blob) => {
        if (blob) {
          FileSaver.saveAs(blob, `recent-trades-${new Date().toISOString().split('T')[0]}.png`)
        }
      })
    } catch (error) {
      console.error('Failed to export PNG:', error)
    }
  }, [])

  const handleDownloadData = useCallback(() => {
    if (!trades || trades.length === 0) return

    // Create CSV content
    const headers = ['ID', 'Counterparty', 'Instrument', 'Trade Date', 'Maturity Date', 'Notional', 'Cash Out', 'Desk']
    const csvData = trades.map(trade => [
      trade.id,
      trade.counterparty,
      trade.instrument,
      trade.tradeDt,
      trade.maturityDt,
      trade.notional,
      trade.cashOut,
      trade.desk
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => 
        // Escape commas and quotes in CSV
        typeof field === 'string' && (field.includes(',') || field.includes('"')) 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    FileSaver.saveAs(blob, `recent-trades-data-${new Date().toISOString().split('T')[0]}.csv`)
  }, [trades])

  if (isLoading) {
    return (
      <Card className={cn("min-h-[100px]", className)}>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("min-h-[350px]", className)}>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <AlertCircle className="size-4 text-destructive" />
            <span className="text-sm text-destructive">{error?.message || 'Error loading trades'}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card ref={cardRef} className={cn("min-h-[200px]", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-[4px]">
          <CardTitle>{activeTab === "recent" ? "Recent Trades" : "Trades Maturing Soon"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {activeTab === "recent" 
              ? `This month's activity: ${stats.tradeCount} trades across ${stats.counterparties} counterparties, ${stats.instruments} instruments, and ${stats.currencies} currencies`
              : `Upcoming maturities: ${stats.tradeCount} trades across ${stats.counterparties} counterparties, ${stats.instruments} instruments, and ${stats.currencies} currencies`
            }
          </p>
        </div>
        <div className="flex items-center gap-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-1" 
            onClick={handleDownloadData} 
            disabled={!trades || trades.length === 0}
          >
            <Download className="size-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-1" 
            onClick={handleExportPNG} 
            disabled={!trades || trades.length === 0}
          >
            <Image className="size-3" />
          </Button>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Recent Trades</TabsTrigger>
            <TabsTrigger value="maturing">Maturing Soon</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="recent" className="mt-2">
          <CardContent className="space-y-0 pb-0">
            <ScrollArea>
            {currentTrades.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center ">
            No trades available
          </div>
        ) : (
          <>
            {currentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2 px-3 border-b last:border-0 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {getInitials(trade.counterparty)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{trade.counterparty}</div>
                    <div className="text-xs text-muted-foreground">
                      {trade.instrument} • {formatDate(trade.tradeDt)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(trade.cashOut)}
                  </div>
                </div>
              </div>
            ))}
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentPage === 0}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage === totalPages - 1}
                  className="text-muted-foreground"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
        </ScrollArea>
      </CardContent>
    </TabsContent>
    
    <TabsContent value="maturing" className="mt-2">
      <CardContent className="space-y-0 pb-0">
        <ScrollArea>
        {currentTrades.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center">
            No maturing trades available
          </div>
        ) : (
          <>
            {currentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2 px-3 border-b last:border-0 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {getInitials(trade.counterparty)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{trade.counterparty}</div>
                    <div className="text-xs text-muted-foreground">
                      {trade.instrument} • Matures {formatDate(trade.maturityDt)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(trade.cashOut)}
                  </div>
                </div>
              </div>
            ))}
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentPage === 0}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage === totalPages - 1}
                  className="text-muted-foreground"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
        </ScrollArea>
      </CardContent>
    </TabsContent>
  </Tabs>
    </Card>
  )
}