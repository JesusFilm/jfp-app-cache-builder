import React from "react"

export function handleReadingLanguageDataColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "readingLanguageId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "metadataLanguageTag":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "bibleCodeData":
    case "countryData":
    case "languageData":
    case "mediaItemData":
      if (typeof value === "string" && value.length > 30) {
        return value.substring(0, 30) + "..."
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
