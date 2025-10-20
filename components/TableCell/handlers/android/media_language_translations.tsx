import React from "react"

import { formatObject, IdCode } from "../components"

export function handleMediaLanguageTranslationsColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
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
