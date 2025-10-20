import React from "react"

import { formatObject, DataModal } from "../components"

export function handleReadingLanguageDataColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "bibleCodeData":
    case "countryData":
    case "languageData":
    case "mediaItemData":
      return <DataModal value={value} title={columnName} />
    default:
      return formatObject(value)
  }
}
