import React from "react"

export function handleTermTranslationsColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "languageTag":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "label":
      if (typeof value === "string") {
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
            {value}
          </span>
        )
      }
      return value || ""

    case "term":
      if (typeof value === "string" && value.length > 40) {
        return value.substring(0, 40) + "..."
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
