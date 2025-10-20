import React from "react"

export function handleCountriesColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "countryId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "name":
    case "continentName":
      if (typeof value === "string" && value.length > 30) {
        return value.substring(0, 30) + "..."
      }
      return value || ""

    case "languageHavingMediaCount":
    case "population":
      if (typeof value === "number") {
        // Use consistent formatting to avoid hydration mismatches
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      }
      return value || ""

    case "longitude":
    case "latitude":
      if (typeof value === "number") {
        return value.toFixed(4)
      }
      return value || ""

    case "flagLossyWeb":
    case "flagPng8":
      if (value && typeof value === "string" && value.trim() !== "") {
        return (
          <img
            src={value}
            alt={value}
            className="w-8 h-6 object-cover rounded border"
          />
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
