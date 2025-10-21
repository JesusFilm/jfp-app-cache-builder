import React from "react"

import { IdCode, formatNumber, formatObject, AudioPlayer } from "../components"

export function handleLanguageColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "speakerCount":
    case "numCountries":
      return formatNumber(value)
    case "audioPreviewURL":
      if (value && typeof value === "string" && value.trim() !== "") {
        return <AudioPlayer src={value} />
      }
      return String(value || "")
    case "primaryCountryId":
      return (
        <IdCode
          value={value}
          t="Country"
          q={`countryId:"${value}"`}
          platform="ios"
        />
      )
    case "currentDescriptorLanguageId":
      return (
        <IdCode
          value={value}
          t="Language"
          q={`languageId:"${value}"`}
          platform="ios"
        />
      )

    default:
      return formatObject(value)
  }
}
