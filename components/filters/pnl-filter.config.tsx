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

// Filter operators constants
export const FilterOperators = {
  IS: "is",
  IS_NOT: "is not",
  IS_ANY_OF: "is any of",
  INCLUDE: "include",
  DO_NOT_INCLUDE: "do not include",
  INCLUDE_ALL_OF: "include all of",
  INCLUDE_ANY_OF: "include any of",
  EXCLUDE_ALL_OF: "exclude all of",
  EXCLUDE_IF_ANY_OF: "exclude if any of",
  BEFORE: "before",
  AFTER: "after",
  BEFORE_AND_EQUAL: "before & equal",
  AFTER_AND_EQUAL: "after & equal"
}

// PnL filter configuration
export const pnlFilterConfig = {
  // Filter types mapping to database columns
  filterTypes: {
    "hmsDesk": "hmsDesk",
    "subRegion": "subRegion", 
    "tradingLocation": "tradingLocation",
    "hmsSL1": "hmsSL1",

   
  },

  // Filter operators for different field types
  filterOperators: {
    "is": "=",
    "is not": "!=",
    "is any of": "IN",
    "include": "ILIKE",
    "do not include": "NOT ILIKE",
    "include all of": "ILIKE",
    "include any of": "ILIKE",
    "exclude all of": "NOT ILIKE",
    "exclude if any of": "NOT ILIKE",
    "before": "<",
    "after": ">",
    "before & equal": "<=",
    "after & equal": ">=",
  },

  // Icon mapping for filter types and values
  iconMapping: {
    // Filter type icons
    "hmsDesk": <Building className="size-4 text-blue-500" />,
    "hmsSL1": <BarChart3 className="size-4 text-purple-500" />,
    "tradingLocation": <PieChart className="size-4 text-green-500" />,


  },

  // Operator configuration for different field types
  operatorConfig: {
    "hmsDesk": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "hmsDesk",
    },
    "hmsSL1": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "hmsSL1",
    },
    "hmsPortfolio": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "hmsPortfolio",
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
  tableName: "pnl_eod",
}

// Export individual parts for flexibility
export const {
  filterTypes,
  filterOperators,
  iconMapping,
  operatorConfig,
  dateValues
} = pnlFilterConfig