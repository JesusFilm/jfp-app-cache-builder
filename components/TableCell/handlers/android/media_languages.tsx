import React from "react"

export function handleMediaLanguagesColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "mediaLanguageId":
    case "primaryCountryId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "name":
    case "nameNative":
      if (typeof value === "string" && value.length > 30) {
        return value.substring(0, 30) + "..."
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

    case "speakerCount":
      if (typeof value === "number") {
        // Use consistent formatting to avoid hydration mismatches
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      }
      return value || ""

    case "audioPreviewUrl":
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

    default:
      // Handle objects by converting to JSON string
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value)
      }
      return String(value || "")
  }
}
