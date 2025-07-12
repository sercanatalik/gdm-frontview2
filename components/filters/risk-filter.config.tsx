import React from "react"
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Target,
  DollarSign,
  Calendar,
  Building,
  User,
  MapPin,
  Star,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react"

// Risk filter configuration
export const riskFilterConfig = {
  // Filter types mapping to database columns
  filterTypes: {
    "Desk": "desk",
    "SL1": "SL1",
    "Portfolio": "portfolio",
    "CCY": "ccy",
    "Counterparty": "counterparty",
    "As Of Date": "asOfDate",
    "VC Product": "vcProduct",
  },

  // Filter operators for different field types
  filterOperators: {
    "is": "=",
    "is not": "!=",
    "contains": "ILIKE",
    "does not contain": "NOT ILIKE",
    "starts with": "ILIKE",
    "ends with": "ILIKE",
    "is greater than": ">",
    "is less than": "<",
    "is between": "BETWEEN",
    "is empty": "IS NULL",
    "is not empty": "IS NOT NULL",
  },

  // Icon mapping for filter types and values
  iconMapping: {
    // Filter type icons
    "Desk": <Building className="size-4 text-blue-500" />,
    "SL1": <BarChart3 className="size-4 text-purple-500" />,
    "Portfolio": <PieChart className="size-4 text-green-500" />,
    "CCY": <DollarSign className="size-4 text-yellow-500" />,
    "Counterparty": <User className="size-4 text-orange-500" />,
    "As Of Date": <Calendar className="size-4 text-gray-500" />,
    "VC Product": <Target className="size-4 text-red-500" />,

  },

  // Operator configuration for different field types
  operatorConfig: {
    "Desk": {
      operators: ["is", "is not"],
      type: "select",
    },
    "SL1": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Portfolio": {
      operators: ["is", "is not"],
      type: "select",
    },
    "CCY": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Counterparty": {
      operators: ["is", "is not", "contains", "does not contain"],
      type: "text",
    },
    "asOfDate": {
      operators: ["is", "is greater than", "is less than", "is between"],
      type: "date",
    },
    "VC Product": {
      operators: ["is", "is not"],
      type: "select",
    },
  },

  // Date values for date fields
  dateValues: [
    "Today",
    "Yesterday", 
    "This Week",
    "Last Week",
    "This Month",
    "Last Month",
    "This Quarter",
    "Last Quarter",
    "This Year",
    "Last Year",
  ],

  // Default table name
  tableName: "risk_f_mv",
}

// Export individual parts for flexibility
export const { 
  filterTypes, 
  filterOperators, 
  iconMapping, 
  operatorConfig, 
  dateValues 
} = riskFilterConfig