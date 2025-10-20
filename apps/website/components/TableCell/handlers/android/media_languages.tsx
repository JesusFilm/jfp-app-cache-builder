import React from "react"

import { AudioPlayer, formatNumber, formatObject, IdCode } from "../components"

export function handleMediaLanguagesColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "primaryCountryId":
      return (
        <IdCode
          value={value}
          t="countries"
          q={`countryId:"${value}"`}
          platform="android"
        />
      )

    case "speakerCount":
      return formatNumber(value)

    case "audioPreviewUrl":
      return <AudioPlayer src={value} />

    default:
      return formatObject(value)
  }
}
