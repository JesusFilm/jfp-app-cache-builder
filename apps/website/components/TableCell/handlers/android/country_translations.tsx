import React from "react"

import { IdCode, formatObject } from "../components"

export function handleCountryTranslationsColumn(
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
    default:
      return formatObject(value)
  }
}
