import React from "react"

import { IdCode, formatNumber, formatObject } from "../components"

export function handleSpokenLanguagesColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "countryId":
      return (
        <IdCode
          value={value}
          t="countries"
          q={`countryId:"${value}"`}
          platform="android"
        />
      )
    case "languageId":
      return (
        <IdCode
          value={value}
          t="media_languages"
          q={`mediaLanguageId:"${value}"`}
          platform="android"
        />
      )

    case "speakerCount":
      return formatNumber(value)

    default:
      return formatObject(value)
  }
}
