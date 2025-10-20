import React from "react"

export function handleSuggestedLanguagesColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "countryId":
    case "languageId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "languageRank":
      if (typeof value === "number") {
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
            #{value}
          </span>
        )
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
