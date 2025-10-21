import Realm, { ObjectSchema } from "realm"

export class SuggestedLanguage extends Realm.Object<SuggestedLanguage> {
  countryLanguageId!: string
  languageId!: number
  languageRank!: number

  static schema: ObjectSchema = {
    name: "SuggestedLanguage",
    primaryKey: "countryLanguageId",
    properties: {
      countryLanguageId: "string",
      languageId: "int",
      languageRank: "int",
    },
  }
}
