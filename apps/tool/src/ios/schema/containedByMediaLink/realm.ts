import Realm, { ObjectSchema } from "realm"

import { MediaItem } from "../mediaItem/realm.js"

export class ContainedByMediaLink extends Realm.Object<ContainedByMediaLink> {
  parentSortLink!: string
  mediaComponentId!: string
  linkType!: string
  parentMediaComponentId!: string
  sortOrder!: number
  mediaItem!: MediaItem

  static schema: ObjectSchema = {
    name: "ContainedByMediaLink",
    primaryKey: "parentSortLink",
    properties: {
      parentSortLink: "string",
      mediaComponentId: "string",
      linkType: "string",
      parentMediaComponentId: "string",
      sortOrder: "int",
      mediaItem: "MediaItem",
    },
  }
}
