import React from "react"

export function handleMediaItemColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "lengthInSeconds":
      if (typeof value === "number") {
        // Format duration in seconds to MM:SS format for iOS
        const minutes = Math.floor(value / 60)
        const seconds = Math.floor(value % 60)
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
      }
      return value || ""

    case "approxLargeDownloadSize":
    case "approxSmallDownloadSize":
      if (typeof value === "number") {
        // Format file sizes in MB
        const mb = value / (1024 * 1024)
        return `${mb.toFixed(1)} MB`
      }
      return value || ""

    case "highResImageUrl":
    case "lowResImageUrl":
    case "veryLowResImageUrl":
    case "thumbnailUrl":
    case "videoStillUrl":
      if (value && typeof value === "string" && value.trim() !== "") {
        return (
          <img
            src={value}
            alt="Media thumbnail"
            className="w-16 h-12 object-cover rounded border"
          />
        )
      }
      return value || ""

    case "isDownloadable":
      return value ? "Yes" : "No"

    case "languageIds":
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} languages` : "No languages"
      }
      return value || ""

    case "englishLongDescription":
    case "longDescription":
    case "englishShortDescription":
    case "shortDescription":
      if (typeof value === "string" && value.length > 100) {
        return value.substring(0, 100) + "..."
      }
      return value || ""

    case "englishBibleCitationsData":
    case "bibleCitationsData":
    case "englishStudyQuestionsData":
    case "studyQuestionsData":
      if (typeof value === "string" && value.length > 50) {
        return value.substring(0, 50) + "..."
      }
      return value || ""

    default:
      // Handle objects by converting to JSON string
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value)
      }
      return String(value || "")
  }
}
