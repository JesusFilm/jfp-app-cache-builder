import { media_metadata as MediaMetadata } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_MediaMetadataQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformMediaMetadata({
  readOnly = false,
  logger,
}: TransformOptions): Promise<MediaMetadata[]> {
  logger?.info("Starting media metadata transformation")

  const allMediaMetadata: MediaMetadata[] = []
  let offset = 0
  const limit = 100
  let hasMoreData = true

  while (hasMoreData) {
    logger?.info({ offset, limit }, "Fetching media metadata page")

    const { data } = await client.query({
      query,
      variables: { offset, limit },
    })

    const videos = data.videos
    logger?.info(
      { count: videos.length, offset, limit },
      "Retrieved videos from API for media metadata"
    )

    if (videos.length === 0) {
      hasMoreData = false
      logger?.info({ offset }, "No more videos to fetch")
      break
    }

    const mediaMetadata: MediaMetadata[] = []

    // Process each video
    for (const video of videos) {
      // Group metadata items by language tag
      const metadataByLanguage = new Map<
        string,
        {
          title?: string
          longDescription?: string
          shortDescription?: string
          studyQuestions: string[]
        }
      >()

      // Process title array
      for (const titleItem of video.title) {
        const languageTag = titleItem.language.metadataLanguageTag
        if (!languageTag) continue

        if (!metadataByLanguage.has(languageTag)) {
          metadataByLanguage.set(languageTag, { studyQuestions: [] })
        }
        const metadata = metadataByLanguage.get(languageTag)!
        metadata.title = titleItem.value
      }

      // Process longDescription array
      for (const longDescriptionItem of video.longDescription) {
        const languageTag = longDescriptionItem.language.metadataLanguageTag
        if (!languageTag) continue

        if (!metadataByLanguage.has(languageTag)) {
          metadataByLanguage.set(languageTag, { studyQuestions: [] })
        }
        const metadata = metadataByLanguage.get(languageTag)!
        metadata.longDescription = longDescriptionItem.value
      }

      // Process shortDescription array
      for (const shortDescriptionItem of video.shortDescription) {
        const languageTag = shortDescriptionItem.language.metadataLanguageTag
        if (!languageTag) continue

        if (!metadataByLanguage.has(languageTag)) {
          metadataByLanguage.set(languageTag, { studyQuestions: [] })
        }
        const metadata = metadataByLanguage.get(languageTag)!
        metadata.shortDescription = shortDescriptionItem.value
      }

      // Process study questions array
      for (const questionItem of [...video.studyQuestions].sort(
        (a, b) => a.order - b.order
      )) {
        const languageTag = questionItem.language.metadataLanguageTag
        if (!languageTag) continue

        if (!metadataByLanguage.has(languageTag)) {
          metadataByLanguage.set(languageTag, { studyQuestions: [] })
        }
        const metadata = metadataByLanguage.get(languageTag)!
        metadata.studyQuestions.push(questionItem.value)
      }

      // Create media metadata records for each language
      for (const [languageTag, metadata] of metadataByLanguage) {
        const mediaMetadataItem = {
          mediaId: video.id,
          title: metadata.title ?? "",
          shortDescription: metadata.shortDescription ?? "",
          longDescription: metadata.longDescription ?? "",
          studyQuestions:
            metadata.studyQuestions.length > 0
              ? JSON.stringify(metadata.studyQuestions)
              : null,
          metadataLanguageTag: languageTag,
        }

        mediaMetadata.push(mediaMetadataItem)
        allMediaMetadata.push(mediaMetadataItem)
      }
    }

    logger?.info(
      { count: mediaMetadata.length, offset },
      "Transformed videos into media metadata for page"
    )

    if (!readOnly) {
      logger?.info("Writing media metadata page to database")

      const db = await getDb()

      await Promise.all(
        mediaMetadata.map(async (item) => {
          await db.media_metadata.create({
            data: item,
          })
        })
      )
      logger?.info(
        { count: mediaMetadata.length, offset },
        "Successfully wrote media metadata page to database"
      )
    } else {
      logger?.info(
        { count: mediaMetadata.length, offset },
        "Read-only mode - skipping database write for page"
      )
    }

    offset += limit
  }

  logger?.info(
    { totalCount: allMediaMetadata.length },
    "Media metadata transformation completed"
  )

  return allMediaMetadata
}
