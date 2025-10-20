"use client"

import {
  // iOS handlers
  handleBibleCodeColumn,
  handleContainedByMediaLinkColumn,
  handleCountryColumn,
  handleCountryLinkColumn,
  handleEtagColumn,
  handleLanguageColumn,
  handleMediaCategoryColumn,
  handleMediaItemColumn,
  handleReadingLanguageDataColumn,
  handleSuggestedLanguageColumn,
  // Android handlers
  handleCountriesColumn,
  handleCountryTranslationsColumn,
  handleMediaDataColumn,
  handleMediaLanguageLinksColumn,
  handleMediaLanguageTranslationsColumn,
  handleMediaLanguagesColumn,
  handleMediaMetadataColumn,
  handleReadingLanguagesColumn,
  handleRoomMasterTableColumn,
  handleSpokenLanguagesColumn,
  handleSuggestedLanguagesColumn,
  handleTermTranslationsColumn,
} from "./handlers"

interface TableCellProps {
  value: any
  tableName?: string
  columnName?: string
  platform?: "ios" | "android"
}

export default function TableCell({
  value,
  tableName,
  columnName,
  platform,
}: TableCellProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "object") return JSON.stringify(value)
    if (typeof value === "string" && value.length > 100) {
      return value.substring(0, 100) + "..."
    }
    return String(value)
  }

  // Handle special cases using platform-specific table handlers
  const handleSpecialCases = (
    value: any,
    tableName?: string,
    columnName?: string,
    platform?: "ios" | "android"
  ) => {
    if (!tableName || !columnName || !platform) {
      return formatValue(value)
    }

    // iOS table handlers
    if (platform === "ios") {
      switch (tableName) {
        case "BibleCode":
          return handleBibleCodeColumn(columnName, value)
        case "ContainedByMediaLink":
          return handleContainedByMediaLinkColumn(columnName, value)
        case "Country":
          return handleCountryColumn(columnName, value)
        case "CountryLink":
          return handleCountryLinkColumn(columnName, value)
        case "Etag":
          return handleEtagColumn(columnName, value)
        case "Language":
          return handleLanguageColumn(columnName, value)
        case "MediaCategory":
          return handleMediaCategoryColumn(columnName, value)
        case "MediaItem":
          return handleMediaItemColumn(columnName, value)
        case "ReadingLanguageData":
          return handleReadingLanguageDataColumn(columnName, value)
        case "SuggestedLanguage":
          return handleSuggestedLanguageColumn(columnName, value)
        default:
          return formatValue(value)
      }
    }

    // Android table handlers
    if (platform === "android") {
      switch (tableName) {
        case "countries":
          return handleCountriesColumn(columnName, value)
        case "country_translations":
          return handleCountryTranslationsColumn(columnName, value)
        case "media_data":
          return handleMediaDataColumn(columnName, value)
        case "media_language_links":
          return handleMediaLanguageLinksColumn(columnName, value)
        case "media_language_translations":
          return handleMediaLanguageTranslationsColumn(columnName, value)
        case "media_languages":
          return handleMediaLanguagesColumn(columnName, value)
        case "media_metadata":
          return handleMediaMetadataColumn(columnName, value)
        case "reading_languages":
          return handleReadingLanguagesColumn(columnName, value)
        case "room_master_table":
          return handleRoomMasterTableColumn(columnName, value)
        case "spoken_languages":
          return handleSpokenLanguagesColumn(columnName, value)
        case "suggested_languages":
          return handleSuggestedLanguagesColumn(columnName, value)
        case "term_translations":
          return handleTermTranslationsColumn(columnName, value)
        default:
          return formatValue(value)
      }
    }

    // Default formatting for all other cases
    return formatValue(value)
  }

  const formattedValue = handleSpecialCases(
    value,
    tableName,
    columnName,
    platform
  )

  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <div
        className="max-w-xs truncate"
        title={
          typeof formattedValue === "string" ? formattedValue : String(value)
        }
      >
        {formattedValue}
      </div>
    </td>
  )
}
