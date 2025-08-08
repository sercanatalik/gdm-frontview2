"use client"

import React, { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Download, Image, Copy, Clock, Calendar, TrendingUp, User, Building, MapPin } from "lucide-react"
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

const ITEMS_PER_PAGE = 8

export function RecentTradesCard({ filters = [], className, asOfDate }: RecentTradesCardProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState("recent")
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
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

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade)
    setIsModalOpen(true)
  }

  const getDaysToMaturity = (maturityDt: string) => {
    const today = new Date()
    const maturityDate = new Date(maturityDt)
    const timeDiff = maturityDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  const formatLargeNumber = (value: number) => {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    
    if (absValue >= 1000000) {
      return `${sign}$${(absValue / 1000000).toFixed(2)}M`
    }
    return `${sign}$${absValue.toLocaleString()}`
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
    <>
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
              <div 
                key={trade.id} 
                className="flex items-center justify-between py-2 px-3 border-b last:border-0 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => handleTradeClick(trade)}
              >
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
              <div className="flex items-center justify-between pt-8">
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
              <div 
                key={trade.id} 
                className="flex items-center justify-between py-2 px-3 border-b last:border-0 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => handleTradeClick(trade)}
              >
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
              <div className="flex items-center justify-between pt-8">
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

    {/* Trade Detail Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-[100vw] w-[100vw] h-[95vh] max-h-[95vh] overflow-y-auto sm:max-w-[100vw]">
        {selectedTrade && (
          <>
            <DialogHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {getInitials(selectedTrade.counterparty)}
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedTrade.instrument}</DialogTitle>
                  <p className="text-sm text-muted-foreground">Trade ID: {selectedTrade.id}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-4">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  ACTIVE
                </div>
                {(() => {
                  const daysToMaturity = getDaysToMaturity(selectedTrade.maturityDt)
                  if (daysToMaturity <= 7) {
                    return (
                      <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        URGENT - {daysToMaturity} days remaining
                      </div>
                    )
                  }
                  return null
                })()}
                <div className="ml-auto text-right">
                  <p className="text-sm text-muted-foreground">Maturity Date</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatDate(selectedTrade.maturityDt)}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Notional Amount</span>
                </div>
                <p className="text-2xl font-bold">{formatLargeNumber(selectedTrade.notional)}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Cash Out</span>
                </div>
                <p className="text-2xl font-bold">{formatLargeNumber(selectedTrade.cashOut)}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">P&L</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatLargeNumber(selectedTrade.cashOut - selectedTrade.notional)}
                </p>
                <p className="text-sm text-muted-foreground">
                  ({(((selectedTrade.cashOut - selectedTrade.notional) / selectedTrade.notional) * 100).toFixed(2)}%)
                </p>
              </Card>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Instrument Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Instrument Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instrument ID</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{selectedTrade.instrument}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instrument Name</span>
                    <span className="font-medium">{selectedTrade.instrument}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="px-2 py-1 bg-muted rounded text-sm font-medium">Swap</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Portfolio</span>
                    <span className="font-medium">Leverage</span>
                  </div>
                </div>
              </div>

              {/* Trading Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Trading Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Counterparty</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                        {getInitials(selectedTrade.counterparty)}
                      </div>
                      <span className="font-medium">{selectedTrade.counterparty}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trader</span>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Sarah Johnson</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desk</span>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{selectedTrade.desk}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Region</span>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">EMEA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Days to Maturity</p>
                    <p className="text-lg font-semibold text-red-600">
                      {getDaysToMaturity(selectedTrade.maturityDt)} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Maturity Date</p>
                    <p className="text-lg font-semibold">
                      {formatDate(selectedTrade.maturityDt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Maturity Time</p>
                    <p className="text-lg font-semibold">15:08</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-10 pt-6 border-t">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  View in Trading System
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Generate Report
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Button className="bg-black text-white hover:bg-gray-800" disabled>
                  Schedule Action
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}