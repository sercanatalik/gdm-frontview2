"use client"

import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { AsOfDateSelect } from "@/components/filters/as-of-date-select"
import { PerspectiveViewer } from "@/components/datagrid/perspective-viewer"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import "@/styles/perspective.css"

const tableConfig = {
  "Risk": "f_exposure",
  "Trades": "f_trade"
}

export default function DataGridPage() {
  // Sample data for demonstration
  const [data, setData] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("f_exposure")

  useEffect(() => {
    // Generate sample data
    const sampleData = Array.from({ length: 10000 }, (_, i) => ({
      id: i + 1,
      name: `Customer ${i + 1}`,
      department: ["Sales", "Marketing", "Engineering", "Support", "Finance"][Math.floor(Math.random() * 5)],
      status: ["Active", "Pending", "Inactive"][Math.floor(Math.random() * 3)],
      priority: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
      revenue: Math.floor(Math.random() * 100000) + 10000,
      employees: Math.floor(Math.random() * 500) + 10,
      date_created: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      satisfaction: (Math.random() * 5).toFixed(2),
      country: ["USA", "UK", "Germany", "France", "Japan", "Canada"][Math.floor(Math.random() * 6)],
    }))
    setData(sampleData)
  }, [])

  return (
    <div className="p-0 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Data Grid</h2>

        <div className="flex items-center gap-3">
          
          <RiskFilter
            tableName={selectedTable}
            filterTypes={riskFilterConfig.filterTypes}
            filterOperators={riskFilterConfig.filterOperators}
            iconMapping={riskFilterConfig.iconMapping}
            operatorConfig={riskFilterConfig.operatorConfig}
            dateValues={riskFilterConfig.dateValues}
          />
          <AsOfDateSelect tableName={selectedTable} />
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="h-8 text-sm rounded-sm border-none bg-transparent hover:bg-accent hover:text-accent-foreground gap-1.5 px-3 w-auto min-w-[100px]">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(tableConfig).map(([label, value]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1">
        <div className="border rounded-lg p-4 bg-background w-full h-full">
          <PerspectiveViewer
            data={data}
            theme="pro-dark"
            view="datagrid"
          />
        </div>
      </div>

    </div>
  )
}