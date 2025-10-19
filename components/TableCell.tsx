"use client"

interface TableCellProps {
  value: any
  tableName?: string
  columnName?: string
}

export default function TableCell({
  value,
  tableName,
  columnName,
}: TableCellProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "object") return JSON.stringify(value)
    if (typeof value === "string" && value.length > 100) {
      return value.substring(0, 100) + "..."
    }
    return String(value)
  }

  // Handle special cases based on table name and column name
  const handleSpecialCases = (
    value: any,
    tableName?: string,
    columnName?: string
  ) => {
    // Handle Country table flag URLs
    if (
      tableName === "Country" &&
      (columnName === "flagUrlPng" || columnName === "flagUrlWebPLossy50")
    ) {
      if (value && typeof value === "string" && value.trim() !== "") {
        return (
          <img
            src={value}
            alt={value}
            className="w-8 h-6 object-cover rounded border"
          />
        )
      }
    }

    // Default formatting for all other cases
    return formatValue(value)
  }

  const formattedValue = handleSpecialCases(value, tableName, columnName)

  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <div
        className="max-w-xs truncate"
        title={
          typeof formattedValue === "string" ? formattedValue : String(value)
        }
      >
        {formattedValue}
      </div>
    </td>
  )
}
