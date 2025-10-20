import React from "react"
import {
  ImageThumbnail,
  formatNumber,
  formatDecimal,
  formatArrayLength,
  formatObject,
  IdCode,
} from "../components"

export function handleCountryColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "flagUrlPng":
    case "flagUrlWebPLossy50":
      return <ImageThumbnail src={value} alt={value} />

    case "latitude":
    case "longitude":
      return formatDecimal(value)

    case "countryPopulation":
    case "languageCount":
    case "languageCountHavingMedia":
      return formatNumber(value)

    case "languageSpeakerCounts":
    case "suggestedLanguages":
      return formatArrayLength(value)

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
