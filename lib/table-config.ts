// Table configuration for mapping table-specific column names
// This handles differences between tables (e.g., risk_mv uses snake_case)

interface TableConfig {
  dateColumn: string       // The column used for as-of-date filtering
  dateFormat?: 'date' | 'string'  // Whether the date column is Date type or String (YYYYMMDD)
}

const TABLE_CONFIGS: Record<string, TableConfig> = {
  risk_mv: {
    dateColumn: 'as_of_date',
    dateFormat: 'string',  // as_of_date is String type with format "20260220"
  },
  risk: {
    dateColumn: 'as_of_date',
    dateFormat: 'string',
  },
}

const DEFAULT_CONFIG: TableConfig = {
  dateColumn: 'asOfDate',
  dateFormat: 'date',
}

export function getTableConfig(tableName: string): TableConfig {
  return TABLE_CONFIGS[tableName] || DEFAULT_CONFIG
}

// Format a date string for the table's date column comparison
export function formatDateForTable(date: string, tableName: string): string {
  const config = getTableConfig(tableName)
  if (config.dateFormat === 'string') {
    // Convert "2026-02-20" to "20260220"
    return date.replace(/-/g, '')
  }
  return date
}
