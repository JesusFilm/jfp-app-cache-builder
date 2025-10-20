import React from "react"

export function handleMediaMetadataColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "mediaId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "title":
      if (typeof value === "string") {
        return (
          <span className="font-medium text-gray-900">
            {value.length > 50 ? value.substring(0, 50) + "..." : value}
          </span>
        )
      }
      return value || ""

    case "shortDescription":
    case "longDescription":
      if (typeof value === "string" && value.length > 100) {
        return value.substring(0, 100) + "..."
      }
      return value || ""

    case "studyQuestions":
      if (typeof value === "string" && value.length > 50) {
        return value.substring(0, 50) + "..."
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
