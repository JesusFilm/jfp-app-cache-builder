import Realm, { ObjectSchema } from "realm"

export class Language extends Realm.Object<Language> {
  languageId!: string
  audioPreviewURL?: string | undefined
  speakerCount!: number
  iso3!: string
  primaryCountryId!: string
  numCountries!: number
  bcp47?: string | undefined
  metadataLanguageTag!: string
  currentDescriptorLanguageId!: string
  englishName!: string
  name!: string
  nameNative!: string

  static schema: ObjectSchema = {
    name: "Language",
    primaryKey: "languageId",
    properties: {
      languageId: "string",
      audioPreviewURL: "string?",
      speakerCount: "int",
      iso3: "string",
      primaryCountryId: "string",
      numCountries: "int",
      bcp47: "string?",
      metadataLanguageTag: "string",
      currentDescriptorLanguageId: "string",
      englishName: "string",
      name: "string",
      nameNative: "string",
    },
  }
}
