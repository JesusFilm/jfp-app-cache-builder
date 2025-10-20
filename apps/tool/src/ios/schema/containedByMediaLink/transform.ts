import Realm from "realm"

import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"
import { MediaItem } from "../mediaItem/realm.js"

import { JFPAppCacheBuilder_iOS_ContainedByMediaLinkQuery as query } from "./query.js"
import { ContainedByMediaLink } from "./realm.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformContainedByMediaLinks({
  readOnly = false,
  logger,
}: TransformOptions) {
  const { data } = await client.query({
    query,
  })

  logger?.info(
    { count: data.videos.length },
    "Retrieved videos from API for contained by media links"
  )

  const db = await getDb()

  const containedByMediaLinks = data.videos.flatMap((video) => {
    if (video.children.length === 0) {
      return []
    }
    return video.children
      .map((child, index) => {
        const mediaItem = db.objectForPrimaryKey(
          MediaItem,
          child.mediaComponentId
        )

        if (!mediaItem) return null

        return {
          parentSortLink: `${video.parentMediaComponentId}__${index}__arclightContainedBy`,
          mediaComponentId: child.mediaComponentId,
          linkType: "arclightContainedBy",
          parentMediaComponentId: video.parentMediaComponentId,
          sortOrder: index,
          mediaItem,
        }
      })
      .filter((link) => link != null)
  })

  if (!readOnly) {
    logger?.info("Writing contained by media links to database")
    db.write(() => {
      containedByMediaLinks.forEach((link) => {
        db.create(ContainedByMediaLink, link, Realm.UpdateMode.Modified)
      })
    })
    logger?.info(
      { count: containedByMediaLinks.length },
      "Successfully wrote contained by media links to database"
    )
  } else {
    logger?.info(
      { count: containedByMediaLinks.length },
      "Read-only mode - skipping database write"
    )
  }

  return containedByMediaLinks
}
