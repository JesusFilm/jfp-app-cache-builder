import React from "react"
import { IdCode, truncateText, formatObject } from "../components"

export function handleEtagColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "nameLanguageId":
    case "languageId":
      return <IdCode value={value} />

    case "name":
      return truncateText(value, 30)

    case "etag":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-xs bg-yellow-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return String(value || "")

    case "date":
      if (typeof value === "string") {
        try {
          const date = new Date(value)
          // Use a consistent format to avoid hydration mismatches
          return date.toISOString().split("T")[0] // YYYY-MM-DD format
        } catch {
          return String(value || "")
        }
      }
      return String(value || "")

    default:
      return formatObject(value)
  }
}
