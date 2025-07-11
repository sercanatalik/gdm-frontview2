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
    "Risk Level": "risk_level",
    "Risk Category": "risk_category", 
    "Risk Status": "risk_status",
    "Risk Owner": "risk_owner",
    "Department": "department",
    "Likelihood": "likelihood",
    "Impact": "impact",
    "Risk Score": "risk_score",
    "Mitigation Status": "mitigation_status",
    "Date Created": "date_created",
    "Date Updated": "date_updated",
    "Priority": "priority",
    "Geographic Region": "geographic_region",
    "Business Unit": "business_unit",
    "Compliance Status": "compliance_status",
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
    "Risk Level": <AlertTriangle className="size-4 text-red-500" />,
    "Risk Category": <PieChart className="size-4 text-blue-500" />,
    "Risk Status": <Activity className="size-4 text-green-500" />,
    "Risk Owner": <User className="size-4 text-purple-500" />,
    "Department": <Building className="size-4 text-orange-500" />,
    "Likelihood": <TrendingUp className="size-4 text-yellow-500" />,
    "Impact": <Target className="size-4 text-red-600" />,
    "Risk Score": <BarChart3 className="size-4 text-indigo-500" />,
    "Mitigation Status": <Shield className="size-4 text-teal-500" />,
    "Date Created": <Calendar className="size-4 text-gray-500" />,
    "Date Updated": <Clock className="size-4 text-gray-600" />,
    "Priority": <Star className="size-4 text-amber-500" />,
    "Geographic Region": <MapPin className="size-4 text-cyan-500" />,
    "Business Unit": <Building className="size-4 text-pink-500" />,
    "Compliance Status": <CheckCircle className="size-4 text-emerald-500" />,

    // Risk Level value icons
    "Critical": <AlertTriangle className="size-4 text-red-600" />,
    "High": <AlertTriangle className="size-4 text-red-500" />,
    "Medium": <AlertCircle className="size-4 text-yellow-500" />,
    "Low": <Info className="size-4 text-green-500" />,
    "Very Low": <CheckCircle className="size-4 text-green-600" />,

    // Risk Status value icons
    "Open": <XCircle className="size-4 text-red-500" />,
    "In Progress": <Activity className="size-4 text-yellow-500" />,
    "Mitigated": <CheckCircle className="size-4 text-green-500" />,
    "Closed": <CheckCircle className="size-4 text-gray-500" />,
    "Accepted": <Shield className="size-4 text-blue-500" />,

    // Risk Category value icons
    "Operational": <Activity className="size-4 text-blue-500" />,
    "Financial": <DollarSign className="size-4 text-green-500" />,
    "Strategic": <Target className="size-4 text-purple-500" />,
    "Compliance": <Shield className="size-4 text-teal-500" />,
    "Reputational": <Star className="size-4 text-orange-500" />,
    "Technology": <Zap className="size-4 text-indigo-500" />,
    "Environmental": <Activity className="size-4 text-emerald-500" />,
    "Legal": <Shield className="size-4 text-red-500" />,

    // Likelihood value icons
    "Very High": <TrendingUp className="size-4 text-red-600" />,
    "High": <TrendingUp className="size-4 text-red-500" />,
    "Medium": <TrendingUp className="size-4 text-yellow-500" />,
    "Low": <TrendingDown className="size-4 text-green-500" />,
    "Very Low": <TrendingDown className="size-4 text-green-600" />,

    // Impact value icons
    "Catastrophic": <Target className="size-4 text-red-600" />,
    "Major": <Target className="size-4 text-red-500" />,
    "Moderate": <Target className="size-4 text-yellow-500" />,
    "Minor": <Target className="size-4 text-green-500" />,
    "Negligible": <Target className="size-4 text-green-600" />,

    // Priority value icons
    "P1": <Star className="size-4 text-red-600" />,
    "P2": <Star className="size-4 text-red-500" />,
    "P3": <Star className="size-4 text-yellow-500" />,
    "P4": <Star className="size-4 text-green-500" />,
    "P5": <Star className="size-4 text-gray-500" />,

    // Mitigation Status value icons
    "Not Started": <XCircle className="size-4 text-red-500" />,
    "In Progress": <Activity className="size-4 text-yellow-500" />,
    "Completed": <CheckCircle className="size-4 text-green-500" />,
    "On Hold": <Clock className="size-4 text-gray-500" />,
    "Cancelled": <XCircle className="size-4 text-gray-400" />,

    // Compliance Status value icons
    "Compliant": <CheckCircle className="size-4 text-green-500" />,
    "Non-Compliant": <XCircle className="size-4 text-red-500" />,
    "Partially Compliant": <AlertCircle className="size-4 text-yellow-500" />,
    "Under Review": <Clock className="size-4 text-blue-500" />,
  },

  // Operator configuration for different field types
  operatorConfig: {
    "Risk Level": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Risk Category": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Risk Status": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Risk Owner": {
      operators: ["is", "is not", "contains", "does not contain"],
      type: "text",
    },
    "Department": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Likelihood": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Impact": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Risk Score": {
      operators: ["is", "is greater than", "is less than", "is between"],
      type: "number",
    },
    "Mitigation Status": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Date Created": {
      operators: ["is", "is greater than", "is less than", "is between"],
      type: "date",
    },
    "Date Updated": {
      operators: ["is", "is greater than", "is less than", "is between"],
      type: "date",
    },
    "Priority": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Geographic Region": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Business Unit": {
      operators: ["is", "is not"],
      type: "select",
    },
    "Compliance Status": {
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