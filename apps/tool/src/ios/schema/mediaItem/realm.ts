import { Buffer } from "buffer"

import Realm, { ObjectSchema } from "realm"

export class MediaItem extends Realm.Object<MediaItem> {
  mediaComponentId!: string
  languageCount!: number
  sort!: string
  primaryLanguageId!: string
  componentType!: string
  contentType!: string
  lengthInSeconds!: number
  approxLargeDownloadSize?: number | undefined
  approxSmallDownloadSize?: number | undefined
  highResImageUrl!: string
  lowResImageUrl!: string
  veryLowResImageUrl!: string
  thumbnailUrl!: string
  videoStillUrl!: string
  isDownloadable!: boolean
  languageIds!: string
  subType!: string
  groupContentCount!: number
  currentDescriptorLanguageId!: string
  metadataLanguageTag!: string
  englishLongDescription!: string
  longDescription!: string
  englishShortDescription!: string
  shortDescription!: string
  englishName!: string
  name!: string
  englishBibleCitationsData?: Buffer<ArrayBuffer> | undefined
  bibleCitationsData?: Buffer<ArrayBuffer> | undefined
  englishStudyQuestionsData?: Buffer<ArrayBuffer> | undefined
  studyQuestionsData?: Buffer<ArrayBuffer> | undefined

  static schema: ObjectSchema = {
    name: "MediaItem",
    primaryKey: "mediaComponentId",
    properties: {
      mediaComponentId: "string",
      languageCount: "int",
      sort: "string",
      primaryLanguageId: "string",
      componentType: "string",
      contentType: "string",
      lengthInSeconds: "int",
      approxLargeDownloadSize: "double?",
      approxSmallDownloadSize: "double?",
      highResImageUrl: "string",
      lowResImageUrl: "string",
      veryLowResImageUrl: "string",
      thumbnailUrl: "string",
      videoStillUrl: "string",
      isDownloadable: "bool",
      languageIds: "string",
      subType: "string",
      groupContentCount: "int",
      currentDescriptorLanguageId: "string",
      metadataLanguageTag: "string",
      englishLongDescription: "string",
      longDescription: "string",
      englishShortDescription: "string",
      shortDescription: "string",
      englishName: "string",
      name: "string",
      englishBibleCitationsData: "data?",
      bibleCitationsData: "data?",
      englishStudyQuestionsData: "data?",
      studyQuestionsData: "data?",
    },
  }
}
