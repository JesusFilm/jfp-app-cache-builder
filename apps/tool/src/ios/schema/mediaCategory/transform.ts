import Realm from "realm"

import { getDb } from "../../lib/db.js"

import { MediaCategory } from "./realm.js"

import type { introspection_types } from "../../../__generated__/graphql-env.d.ts"
import type { TransformOptions } from "../../../types/transform.js"

type VideoLabel = introspection_types["VideoLabel"]["enumValues"]

const VideoLabelHelper: { [K in VideoLabel]: K } = {
  collection: "collection",
  episode: "episode",
  featureFilm: "featureFilm",
  segment: "segment",
  series: "series",
  shortFilm: "shortFilm",
  trailer: "trailer",
  behindTheScenes: "behindTheScenes",
}

const videoLabels: VideoLabel[] = Object.keys(VideoLabelHelper) as VideoLabel[]

function titleize(str: string) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, function (txt) {
      return txt.toUpperCase()
    })
    .trim()
}

export async function transformMediaCategories({
  readOnly = false,
  logger,
}: TransformOptions) {
  const mediaCategories = videoLabels.map((videoLabel) => ({
    name: videoLabel,
    category_description: titleize(videoLabel),
  }))

  logger?.info({ count: mediaCategories.length }, "Generated media categories")

  if (!readOnly) {
    logger?.info("Writing media categories to database")
    const db = await getDb()
    db.write(() => {
      mediaCategories.forEach((mediaCategory) => {
        db.create(MediaCategory, mediaCategory, Realm.UpdateMode.Modified)
      })
    })
    logger?.info(
      { count: mediaCategories.length },
      "Successfully wrote media categories to database"
    )
  } else {
    logger?.info(
      { count: mediaCategories.length },
      "Read-only mode - skipping database write"
    )
  }

  return mediaCategories
}
