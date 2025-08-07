import Realm, { ObjectSchema } from "realm"

export class BibleCode extends Realm.Object<BibleCode> {
  name!: string
  metadataLanguageTag!: string
  currentDescriptorLanguageId!: string
  englishFullName!: string
  fullName!: string

  static schema: ObjectSchema = {
    name: "BibleCode",
    primaryKey: "name",
    properties: {
      name: "string",
      metadataLanguageTag: "string",
      currentDescriptorLanguageId: "string",
      englishFullName: "string",
      fullName: "string",
    },
  }
}
