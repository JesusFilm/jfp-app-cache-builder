import React from "react"

import {
  ImageThumbnail,
  formatNumber,
  formatDecimal,
  formatObject,
  truncateText,
} from "../components"

export function handleCountriesColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "name":
    case "continentName":
      return truncateText(value, 30)

    case "languageHavingMediaCount":
    case "population":
      return formatNumber(value)

    case "longitude":
    case "latitude":
      return formatDecimal(value)

    case "flagLossyWeb":
    case "flagPng8":
      return <ImageThumbnail src={value} />

    default:
      return formatObject(value)
  }
}
