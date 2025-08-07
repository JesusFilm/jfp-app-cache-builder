import { Buffer } from "buffer"

import Realm, { ObjectSchema } from "realm"

export class ReadingLanguageData extends Realm.Object<ReadingLanguageData> {
  readingLanguageId!: string
  metadataLanguageTag!: string
  bibleCodeData?: Buffer<ArrayBuffer> | undefined
  countryData?: Buffer<ArrayBuffer> | undefined
  languageData?: Buffer<ArrayBuffer> | undefined
  mediaItemData?: Buffer<ArrayBuffer> | undefined

  static schema: ObjectSchema = {
    name: "ReadingLanguageData",
    primaryKey: "readingLanguageId",
    properties: {
      readingLanguageId: "string",
      metadataLanguageTag: "string",
      bibleCodeData: "data?",
      countryData: "data?",
      languageData: "data?",
      mediaItemData: "data?",
    },
  }
}
