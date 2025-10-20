import React from "react"

export function handleBibleCodeColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "name":
    case "englishFullName":
    case "fullName":
      if (typeof value === "string" && value.length > 50) {
        return value.substring(0, 50) + "..."
      }
      return value || ""

    case "metadataLanguageTag":
    case "currentDescriptorLanguageId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
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
