import React from "react"

import { IdCode, truncateText, formatObject } from "../components"

export function handleBibleCodeColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "name":
    case "englishFullName":
    case "fullName":
      return truncateText(value, 50)
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
