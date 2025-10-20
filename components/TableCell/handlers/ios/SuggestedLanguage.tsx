import React from "react"

import { IdCode, formatObject } from "../components"

export function handleSuggestedLanguageColumn(
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
    default:
      return formatObject(value)
  }
}
