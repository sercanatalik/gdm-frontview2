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
}

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
    "is any of": "IN",
    "include": "ILIKE",
    "do not include": "NOT ILIKE",
    "include all of": "ILIKE",
    "include any of": "ILIKE",
    "exclude all of": "NOT ILIKE",
    "exclude if any of": "NOT ILIKE",
    "before": "<",
    "after": ">",
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
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "desk",
    },
    "SL1": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "SL1",
    },
    "Portfolio": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "portfolio",
    },
    "CCY": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "ccy",
    },
    "Counterparty": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.INCLUDE, FilterOperators.DO_NOT_INCLUDE],
      type: "text",
      field: "counterparty",
    },
    "As Of Date": {
      operators: [FilterOperators.IS, FilterOperators.BEFORE, FilterOperators.AFTER],
      type: "date",
      field: "asOfDate",
    },
    "VC Product": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "vcProduct",
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