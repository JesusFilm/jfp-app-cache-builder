import React from "react"

export function handleContainedByMediaLinkColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "parentSortLink":
    case "mediaComponentId":
    case "parentMediaComponentId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "sortOrder":
      if (typeof value === "number") {
        return value.toString()
      }
      return value || ""

    case "linkType":
      if (typeof value === "string") {
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
            {value}
          </span>
        )
      }
      return value || ""

    case "mediaItem":
      if (typeof value === "string") {
        return value.length > 30 ? value.substring(0, 30) + "..." : value
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
