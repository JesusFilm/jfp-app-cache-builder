import React from "react"

export function handleRoomMasterTableColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "id":
      if (typeof value === "number") {
        return value.toString()
      }
      return value || ""

    case "identity_hash":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-xs bg-yellow-100 px-2 py-1 rounded">
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
