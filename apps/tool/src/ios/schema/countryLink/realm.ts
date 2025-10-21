import Realm, { ObjectSchema } from "realm"

export class CountryLink extends Realm.Object<CountryLink> {
  countryLanguageId!: string
  languageId!: number
  speakerCount!: number

  static schema: ObjectSchema = {
    name: "CountryLink",
    primaryKey: "countryLanguageId",
    properties: {
      countryLanguageId: "string",
      languageId: "int",
      speakerCount: "int",
    },
  }
}
