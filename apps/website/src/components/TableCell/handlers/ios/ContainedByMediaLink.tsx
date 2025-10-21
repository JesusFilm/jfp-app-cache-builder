import React from "react"

import { IdCode, formatObject, formatNumber } from "../components"

export function handleContainedByMediaLinkColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "mediaComponentId":
    case "parentMediaComponentId":
      return (
        <IdCode
          value={value}
          t="MediaItem"
          q={`mediaComponentId:"${value}"`}
          platform="ios"
        />
      )
    case "mediaItem":
      if (typeof value === "object" && value !== null) {
        return (
          <IdCode
            value={value.mediaComponentId}
            t="MediaItem"
            q={`mediaComponentId:"${value.mediaComponentId}"`}
            platform="ios"
          />
        )
      }
      return formatObject(value)
    case "sortOrder":
      return formatNumber(value)
    default:
      return formatObject(value)
  }
}
