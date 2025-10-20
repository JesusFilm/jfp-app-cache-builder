import React from "react"

import {
  IdCode,
  formatDurationMilliseconds,
  formatFileSize,
  formatBoolean,
  truncateText,
  formatObject,
  ImageThumbnail,
  formatReferenceText,
} from "../components"

export function handleMediaDataColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    case "primaryMediaLanguageId":
      return (
        <IdCode
          value={value}
          t="media_languages"
          q={`mediaLanguageId:"${value}"`}
          platform="android"
        />
      )

    case "primaryMediaLanguageName":
    case "subType":
      return truncateText(value, 30)
    case "lengthInMilliseconds":
      return formatDurationMilliseconds(value)
    case "isDownloadable":
      return formatBoolean(value)
    case "approximateDownloadLowFileSizeInBytes":
    case "approximateDownloadHighFileSizeInBytes":
      return formatFileSize(value)
    case "bibleCitations": {
      const bibleCitations = JSON.parse(value)
      if (Array.isArray(bibleCitations)) {
        return (
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {bibleCitations.map((citation) => {
              const text = formatReferenceText(citation)
              return (
                <a
                  key={text}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-sm font-medium transition-colors cursor-pointer bg-blue-100 hover:bg-blue-200"
                  href={`https://www.biblegateway.com/passage/?search=${text.replaceAll(" ", "+")}&version=CSB`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📖 {text}
                </a>
              )
            })}
          </div>
        )
      }
      return formatObject(bibleCitations)
    }
    case "imageUrls": {
      const imageUrls = JSON.parse(value)
      if (typeof imageUrls === "object" && imageUrls !== null) {
        return (
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {Object.keys(imageUrls).map((key) => (
              <ImageThumbnail src={imageUrls[key]} alt={key} />
            ))}
          </div>
        )
      }
      return formatObject(imageUrls)
    }
    case "mediaComponentLinks": {
      const mediaComponentLinks = JSON.parse(value)
      if (Array.isArray(mediaComponentLinks)) {
        return (
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {mediaComponentLinks.map((link) => (
              <IdCode
                value={link}
                t="media_components"
                q={`id:"${link}"`}
                platform="android"
              />
            ))}
          </div>
        )
      }
      return formatObject(value)
    }
    default:
      return formatObject(value)
  }
}
