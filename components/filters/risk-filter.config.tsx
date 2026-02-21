import React from "react"
import {
  BarChart3,
  Target,
  Building,
  User,
  Clock,
  MapPin,
  Shield,
  Layers,
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

// Risk filter configuration aligned to risk_mv table schema
export const riskFilterConfig = {
  // Filter types mapping to risk_mv database columns
  filterTypes: {
    "desk": "desk",
    "book_name": "book_name",
    "counterparty_name": "counterparty_name",
    "trade_type": "trade_type",
    "asset_class": "asset_class",
    "collateral_type": "collateral_type",
    "rating": "rating",
    "book_region": "book_region",
    "trade_dt": "trade_dt",
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

  // Icon mapping for filter types
  iconMapping: {
    "desk": <Building className="size-4 text-blue-500" />,
    "book_name": <Layers className="size-4 text-purple-500" />,
    "counterparty_name": <User className="size-4 text-orange-500" />,
    "trade_type": <BarChart3 className="size-4 text-green-500" />,
    "asset_class": <Target className="size-4 text-yellow-500" />,
    "collateral_type": <Shield className="size-4 text-indigo-500" />,
    "rating": <Shield className="size-4 text-red-500" />,
    "book_region": <MapPin className="size-4 text-teal-500" />,
    "trade_dt": <Clock className="size-4 text-gray-500" />,
  },

  // Operator configuration for different field types
  operatorConfig: {
    "desk": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "desk",
    },
    "book_name": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "book_name",
    },
    "counterparty_name": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.INCLUDE, FilterOperators.DO_NOT_INCLUDE],
      type: "text",
      field: "counterparty_name",
    },
    "trade_type": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "trade_type",
    },
    "asset_class": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "asset_class",
    },
    "collateral_type": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "collateral_type",
    },
    "rating": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "rating",
    },
    "book_region": {
      operators: [FilterOperators.IS, FilterOperators.IS_NOT, FilterOperators.IS_ANY_OF],
      type: "select",
      field: "book_region",
    },
    "trade_dt": {
      operators: [FilterOperators.AFTER, FilterOperators.BEFORE, FilterOperators.BEFORE_AND_EQUAL, FilterOperators.AFTER_AND_EQUAL],
      type: "date",
      field: "trade_dt",
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
  tableName: "risk_mv",
}

// Export individual parts for flexibility
export const {
  filterTypes,
  filterOperators,
  iconMapping,
  operatorConfig,
  dateValues
} = riskFilterConfig