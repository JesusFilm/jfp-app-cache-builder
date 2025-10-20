import React from "react"

export function handleEtagColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "nameLanguageId":
    case "languageId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "name":
      if (typeof value === "string" && value.length > 30) {
        return value.substring(0, 30) + "..."
      }
      return value || ""

    case "etag":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-xs bg-yellow-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "date":
      if (typeof value === "string") {
        try {
          const date = new Date(value)
          // Use a consistent format to avoid hydration mismatches
          return date.toISOString().split("T")[0] // YYYY-MM-DD format
        } catch {
          return value
        }
      }
      return value || ""

    default:
      // Handle objects by converting to JSON string
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value)
      }
      return String(value || "")
  }
}
