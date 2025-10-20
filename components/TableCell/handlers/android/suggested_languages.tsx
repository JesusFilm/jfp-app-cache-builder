import React from "react"
import { formatObject, IdCode } from "../components"

export function handleSuggestedLanguagesColumn(
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

    default:
      return formatObject(value)
  }
}
