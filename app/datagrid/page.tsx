"use client"

import { RiskFilter } from "@/components/filters/risk-filter"
import { riskFilterConfig } from "@/components/filters/risk-filter.config"
import { AsOfDateSelect } from "@/components/filters/as-of-date-select"
import { PerspectiveViewer } from "@/components/datagrid/perspective-viewer"
import { useState, useEffect } from "react"
import "@/styles/perspective.css"
export default function DataGridPage() {
  // Sample data for demonstration
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // Generate sample data
    const sampleData = Array.from({ length: 100 }, (_, i) => ({
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
    <div className="p-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Data Grid</h2>

        <div className="flex items-center gap-3">
          <RiskFilter
            tableName={riskFilterConfig.tableName}
            filterTypes={riskFilterConfig.filterTypes}
            filterOperators={riskFilterConfig.filterOperators}
            iconMapping={riskFilterConfig.iconMapping}
            operatorConfig={riskFilterConfig.operatorConfig}
            dateValues={riskFilterConfig.dateValues}
          />
          <AsOfDateSelect tableName={riskFilterConfig.tableName} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="border rounded-lg p-4 bg-background" style={{ height: "600px" }}>
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