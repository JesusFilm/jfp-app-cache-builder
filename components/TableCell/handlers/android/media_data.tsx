import React from "react"

export function handleMediaDataColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "id":
    case "primaryMediaLanguageId":
      if (typeof value === "string") {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {value}
          </span>
        )
      }
      return value || ""

    case "primaryMediaLanguageName":
    case "subType":
      if (typeof value === "string" && value.length > 30) {
        return value.substring(0, 30) + "..."
      }
      return value || ""

    case "componentType":
    case "contentType":
    case "languageCount":
    case "containsCount":
      if (typeof value === "number") {
        return value.toString()
      }
      return value || ""

    case "lengthInMilliseconds":
      if (typeof value === "number") {
        // Format duration in milliseconds to MM:SS format for Android
        const seconds = Math.floor(value / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
      }
      return value || ""

    case "isDownloadable":
      return value ? "Yes" : "No"

    case "approximateDownloadLowFileSizeInBytes":
    case "approximateDownloadHighFileSizeInBytes":
      if (typeof value === "number") {
        // Format file sizes in MB
        const mb = value / (1024 * 1024)
        return `${mb.toFixed(1)} MB`
      }
      return value || ""

    case "bibleCitations":
    case "mediaComponentLinks":
    case "imageUrls":
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
