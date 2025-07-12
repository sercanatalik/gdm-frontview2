import { NextRequest, NextResponse } from 'next/server'
import { getClickHouseCacheService } from '@/lib/clickhouse-cache'

interface StatMeasure {
  key: string
  label: string
  field: string
  tableName: string
  aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min'
}

interface StatData {
  [key: string]: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
}

function parsePeriod(period: string) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  switch (period) {
    case '1d': {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        current: { start: today, end: today },
        previous: { start: yesterday.toISOString().split('T')[0], end: yesterday.toISOString().split('T')[0] }
      }
    }
    
    case '1w': {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      const startOfLastWeek = new Date(startOfWeek)
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
      const endOfLastWeek = new Date(endOfWeek)
      endOfLastWeek.setDate(endOfLastWeek.getDate() - 7)
      
      return {
        current: { 
          start: startOfWeek.toISOString().split('T')[0], 
          end: endOfWeek.toISOString().split('T')[0] 
        },
        previous: { 
          start: startOfLastWeek.toISOString().split('T')[0], 
          end: endOfLastWeek.toISOString().split('T')[0] 
        }
      }
    }
    
    case '1m': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      
      return {
        current: { 
          start: startOfMonth.toISOString().split('T')[0], 
          end: endOfMonth.toISOString().split('T')[0] 
        },
        previous: { 
          start: startOfLastMonth.toISOString().split('T')[0], 
          end: endOfLastMonth.toISOString().split('T')[0] 
        }
      }
    }
    
    case '1y': {
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31)
      
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1)
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31)
      
      return {
        current: { 
          start: startOfYear.toISOString().split('T')[0], 
          end: endOfYear.toISOString().split('T')[0] 
        },
        previous: { 
          start: startOfLastYear.toISOString().split('T')[0], 
          end: endOfLastYear.toISOString().split('T')[0] 
        }
      }
    }
    
    default:
      return {
        current: { start: today, end: today },
        previous: { start: today, end: today }
      }
  }
}

function buildQuery(measures: StatMeasure[], period: { start: string, end: string }, tableName: string, dateField: string = 'date') {
  const aggregations = measures.map(m => {
    let field = m.field
    
    // Handle numeric aggregations - cast to numeric if needed
    if (['sum', 'avg', 'max', 'min'].includes(m.aggregation)) {
      field = `toFloat64OrNull(${m.field})`
    }
    
    return `${m.aggregation}(${field}) as ${m.key}`
  }).join(', ')
  
  return `
    SELECT ${aggregations}
    FROM ${tableName}
    WHERE ${dateField} >= '${period.start}' AND ${dateField} <= '${period.end}'
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { measures, period } = body
    
    if (!measures || !Array.isArray(measures) || measures.length === 0) {
      return NextResponse.json(
        { error: 'Measures array is required' },
        { status: 400 }
      )
    }
    
    if (!period) {
      return NextResponse.json(
        { error: 'Period is required' },
        { status: 400 }
      )
    }
    
    const cacheService = getClickHouseCacheService(300) // 5 minutes cache
    const periods = parsePeriod(period)
    
    // Group measures by table
    const measuresByTable = measures.reduce((acc: Record<string, StatMeasure[]>, measure) => {
      if (!acc[measure.tableName]) {
        acc[measure.tableName] = []
      }
      acc[measure.tableName].push(measure)
      return acc
    }, {})
    
    const result: StatData = {}
    
    // Process each table separately
    for (const [tableName, tableMeasures] of Object.entries(measuresByTable)) {
      // Determine date field - use 'asOfDate' for risk_f_mv, 'date' for others
      const dateField = tableName === 'risk_f_mv' ? 'asOfDate' : 'date'
      
      const currentQuery = buildQuery(tableMeasures, periods.current, tableName, dateField)
      const previousQuery = buildQuery(tableMeasures, periods.previous, tableName, dateField)
      
      const cacheKey = `stats:${tableName}:${period}:${Buffer.from(JSON.stringify(tableMeasures.map(m => m.key))).toString('base64').slice(0, 16)}`
      
      const [currentData, previousData] = await Promise.all([
        cacheService.query<Record<string, number>>(currentQuery, undefined, `${cacheKey}:current`, 300),
        cacheService.query<Record<string, number>>(previousQuery, undefined, `${cacheKey}:previous`, 300)
      ])
      
      // Process results for each measure in this table
      tableMeasures.forEach(measure => {
        const current = currentData[0]?.[measure.key] || 0
        const previous = previousData[0]?.[measure.key] || 0
        const change = current - previous
        const changePercent = previous !== 0 ? (change / previous) * 100 : 0
        
        result[measure.key] = {
          current,
          previous,
          change,
          changePercent
        }
      })
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Stats API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Table') && error.message.includes('doesn\'t exist')) {
        return NextResponse.json(
          { error: 'Table not found' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('column') || error.message.includes('field')) {
        return NextResponse.json(
          { error: 'Invalid field or column' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}