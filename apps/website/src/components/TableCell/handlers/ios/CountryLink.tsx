import React from "react"

import { IdCode, formatNumber, formatObject } from "../components"

export function handleCountryLinkColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "languageId":
      return (
        <IdCode
          value={value}
          t="Language"
          q={`languageId:"${value}"`}
          platform="ios"
        />
      )

    case "speakerCount":
      return formatNumber(value)

    default:
      return formatObject(value)
  }
}
