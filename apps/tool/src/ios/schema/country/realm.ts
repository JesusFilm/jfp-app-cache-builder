import Realm, { ObjectSchema } from "realm"

import { CountryLink } from "../countryLink/realm.js"
import { SuggestedLanguage } from "../suggestedLanguage/realm.js"

export class Country extends Realm.Object<Country> {
  countryId!: string
  flagUrlPng!: string
  flagUrlWebPLossy50!: string
  latitude?: number | undefined
  longitude?: number | undefined
  countryPopulation?: number | undefined
  languageCount?: number
  languageCountHavingMedia?: number
  languageSpeakerCounts!: Realm.List<CountryLink>
  suggestedLanguages!: Realm.List<SuggestedLanguage>
  metadataLanguageTag!: string
  currentDescriptorLanguageId!: string
  englishContinentName!: string
  continentName!: string
  englishName!: string
  name!: string

  static schema: ObjectSchema = {
    name: "Country",
    primaryKey: "countryId",
    properties: {
      countryId: "string",
      flagUrlPng: "string",
      flagUrlWebPLossy50: "string",
      latitude: "float?",
      longitude: "float?",
      countryPopulation: "int?",
      languageCount: "int?",
      languageCountHavingMedia: "int?",
      languageSpeakerCounts: {
        type: "list",
        objectType: "CountryLink",
        optional: false,
      },
      suggestedLanguages: {
        type: "list",
        objectType: "SuggestedLanguage",
        optional: false,
      },
      metadataLanguageTag: "string",
      currentDescriptorLanguageId: "string",
      englishContinentName: "string",
      continentName: "string",
      englishName: "string",
      name: "string",
    },
  }
}
