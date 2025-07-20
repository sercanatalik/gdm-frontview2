"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRecentTrades, type Trade } from "@/lib/query/recent-trades"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RecentTradesCardProps {
  filters?: any[]
  className?: string
}

const ITEMS_PER_PAGE = 10

export function RecentTradesCard({ filters = [], className }: RecentTradesCardProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const { data: trades = [], isLoading, error } = useRecentTrades(filters, 50)

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
      <Card className={cn("min-h-[400px]", className)}>
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
    <Card className={cn("min-h-[400px]", className)}>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <p className="text-sm text-muted-foreground">
          This month's activity: {stats.tradeCount} trades across {stats.counterparties} counterparties, {stats.instruments} instruments, and {stats.currencies} currencies
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-150">
        {currentTrades.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No trades available
          </div>
        ) : (
          <>
            {currentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {getInitials(trade.counterparty)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{trade.counterparty}</div>
                    <div className="text-xs text-muted-foreground">
                      {trade.instrument} • {formatDate(trade.tradeDate)}
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
              <div className="flex items-center justify-between pt-2">
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
    </Card>
  )
}