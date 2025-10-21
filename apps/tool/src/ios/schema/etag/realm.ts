import Realm, { ObjectSchema } from "realm"

export class Etag extends Realm.Object<Etag> {
  nameLanguageId!: string
  name!: string
  languageId!: string
  etag!: string
  date!: Date

  static schema: ObjectSchema = {
    name: "Etag",
    primaryKey: "nameLanguageId",
    properties: {
      nameLanguageId: "string",
      name: "string",
      languageId: "string",
      etag: "string",
      date: "date",
    },
  }
}
