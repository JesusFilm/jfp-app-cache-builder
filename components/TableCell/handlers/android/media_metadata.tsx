import React from "react"

import { DataModal, formatObject, IdCode } from "../components"

export function handleMediaMetadataColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "mediaId":
      return (
        <IdCode
          value={value}
          t="media_data"
          q={`id:"${value}"`}
          platform="android"
        />
      )

    case "studyQuestions": {
      const studyQuestions = JSON.parse(value)
      if (Array.isArray(studyQuestions)) {
        return (
          <DataModal
            value={studyQuestions.map((question: any) => ({ question }))}
            title={columnName}
          />
        )
      }
      return formatObject(studyQuestions)
    }
    default:
      return formatObject(value)
  }
}
