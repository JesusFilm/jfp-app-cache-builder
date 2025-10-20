import React from "react"
import { formatObject, IdCode } from "../components"

export function handleMediaLanguageLinksColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "mediaComponentId":
      return (
        <IdCode
          value={value}
          t="media_data"
          q={`id:"${value}"`}
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
