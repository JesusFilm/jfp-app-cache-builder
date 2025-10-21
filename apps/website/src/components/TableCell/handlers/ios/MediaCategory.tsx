import React from "react"

export function handleMediaCategoryColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "name":
      if (typeof value === "string") {
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
            {value}
          </span>
        )
      }
      return value || ""

    case "category_description":
      if (typeof value === "string" && value.length > 50) {
        return value.substring(0, 50) + "..."
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
