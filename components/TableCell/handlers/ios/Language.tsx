import React from "react"

export function handleLanguageColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "speakerCount":
    case "numCountries":
      if (typeof value === "number") {
        // Use consistent formatting to avoid hydration mismatches
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      }
      return value || ""

    case "audioPreviewURL":
      if (value && typeof value === "string" && value.trim() !== "") {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            🔊 Preview
          </a>
        )
      }
      return value || ""

    case "iso3":
    case "bcp47":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "primaryCountryId":
      if (typeof value === "string") {
        return <span className="text-gray-600">{value}</span>
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
