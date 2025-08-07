import Realm, { ObjectSchema } from "realm"

export class MediaCategory extends Realm.Object<MediaCategory> {
  name!: string
  category_description!: string

  static schema: ObjectSchema = {
    name: "MediaCategory",
    primaryKey: "name",
    properties: {
      name: "string",
      category_description: "string",
    },
  }
}
