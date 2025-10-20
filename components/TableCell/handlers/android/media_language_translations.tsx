import React from "react"

export function handleMediaLanguageTranslationsColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
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
      if (typeof value === "string" && value.length > 40) {
        return value.substring(0, 40) + "..."
      }
      return value || ""

    case "metadataLanguageTag":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
            {value}
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
