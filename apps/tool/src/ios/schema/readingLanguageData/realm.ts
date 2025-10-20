import { Buffer } from "buffer"

import Realm, { ObjectSchema } from "realm"

export interface ReadingLanguageDataObject {
  readingLanguageId: string
  metadataLanguageTag: string
  bibleCodeData?: Buffer<ArrayBuffer> | undefined
  countryData?: Buffer<ArrayBuffer> | undefined
  languageData?: Buffer<ArrayBuffer> | undefined
  mediaItemData?: Buffer<ArrayBuffer> | undefined
}

export class ReadingLanguageData extends Realm.Object<ReadingLanguageDataObject> {
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
