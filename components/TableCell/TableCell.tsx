"use client"

interface TableCellProps {
  value: any
  tableName?: string
  columnName?: string
  platform?: "ios" | "android"
}

export default function TableCell({
  value,
  tableName,
  columnName,
  platform,
}: TableCellProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "object") return JSON.stringify(value)
    if (typeof value === "string" && value.length > 100) {
      return value.substring(0, 100) + "..."
    }
    return String(value)
  }

  // Handle special cases based on table name, column name, and platform
  const handleSpecialCases = (
    value: any,
    tableName?: string,
    columnName?: string,
    platform?: "ios" | "android"
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

    // Handle Country table numeric columns with locale formatting
    if (
      tableName === "Country" &&
      (columnName === "latitude" ||
        columnName === "longitude" ||
        columnName === "countryPopulation" ||
        columnName === "languageCount" ||
        columnName === "languageCountHavingMedia")
    ) {
      if (typeof value === "number") {
        return value.toLocaleString()
      }
    }

    // Example: Platform-specific formatting
    if (
      platform === "ios" &&
      tableName === "MediaItem" &&
      columnName === "duration"
    ) {
      if (typeof value === "number") {
        // Format duration in seconds to MM:SS format for iOS
        const minutes = Math.floor(value / 60)
        const seconds = Math.floor(value % 60)
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
      }
    }

    if (
      platform === "android" &&
      tableName === "media_metadata" &&
      columnName === "duration"
    ) {
      if (typeof value === "number") {
        // Format duration differently for Android
        return `${value}s`
      }
    }

    // Default formatting for all other cases
    return formatValue(value)
  }

  const formattedValue = handleSpecialCases(
    value,
    tableName,
    columnName,
    platform
  )

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
