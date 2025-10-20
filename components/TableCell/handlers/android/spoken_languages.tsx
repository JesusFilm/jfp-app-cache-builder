import React from "react"

export function handleSpokenLanguagesColumn(
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

    case "speakerCount":
      if (typeof value === "number") {
        // Use consistent formatting to avoid hydration mismatches
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
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
