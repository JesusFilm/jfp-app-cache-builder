import React from "react"

export function handleCountryColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "flagUrlPng":
    case "flagUrlWebPLossy50":
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

    case "latitude":
    case "longitude":
    case "countryPopulation":
    case "languageCount":
    case "languageCountHavingMedia":
      if (typeof value === "number") {
        // Use consistent formatting to avoid hydration mismatches
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      }
      return value || ""

    case "languageSpeakerCounts":
    case "suggestedLanguages":
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} items` : "Empty"
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
