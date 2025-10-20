import React from "react"
import {
  ImageThumbnail,
  formatDurationSeconds,
  formatFileSize,
  formatBoolean,
  truncateText,
  formatObject,
  IdCode,
  DataModal,
} from "../components"

export function handleMediaItemColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "lengthInSeconds":
      return formatDurationSeconds(value)
    case "approxLargeDownloadSize":
    case "approxSmallDownloadSize":
      return formatFileSize(value)
    case "highResImageUrl":
    case "lowResImageUrl":
    case "veryLowResImageUrl":
    case "thumbnailUrl":
    case "videoStillUrl":
      return (
        <ImageThumbnail
          src={value}
          alt="Media thumbnail"
          width={16}
          height={12}
        />
      )
    case "isDownloadable":
      return formatBoolean(value)
    case "languageIds":
      return (
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {value.split(",").map((id: string) => (
            <IdCode
              value={id.replaceAll("|", "")}
              t="Language"
              q={`languageId:"${id.replaceAll("|", "")}"`}
              platform="ios"
            />
          ))}
        </div>
      )
    case "englishLongDescription":
    case "longDescription":
    case "englishShortDescription":
    case "shortDescription":
      return truncateText(value, 100)
    case "englishBibleCitationsData":
    case "bibleCitationsData":
    case "englishStudyQuestionsData":
    case "studyQuestionsData":
      return <DataModal value={value} title={columnName} />
    default:
      return formatObject(value)
  }
}
