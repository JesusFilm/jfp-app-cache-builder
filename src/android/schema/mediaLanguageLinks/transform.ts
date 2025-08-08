import { media_language_links as MediaLanguageLink } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_MediaLanguageLinksQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformMediaLanguageLinks({
  readOnly = false,
  logger,
}: TransformOptions): Promise<MediaLanguageLink[]> {
  logger?.info("Starting media language links transformation")

  const allMediaLanguageLinks: MediaLanguageLink[] = []
  let offset = 0
  const limit = 100
  let hasMoreData = true

  while (hasMoreData) {
    logger?.info({ offset, limit }, "Fetching media language links page")

    const { data } = await client.query({
      query,
      variables: { offset, limit },
    })

    const videos = data.videos
    logger?.info(
      { count: videos.length, offset, limit },
      "Retrieved videos from API for media language links"
    )

    if (videos.length === 0) {
      hasMoreData = false
      logger?.info({ offset }, "No more videos to fetch")
      break
    }

    const mediaLanguageLinks: MediaLanguageLink[] = []

    // Transform videos and their language IDs into media_language_links
    for (const video of videos) {
      for (const language of video.languageIds) {
        const link: MediaLanguageLink = {
          mediaComponentId: video.id,
          languageId: language.id,
        }
        mediaLanguageLinks.push(link)
        allMediaLanguageLinks.push(link)
      }
    }

    logger?.info(
      { count: mediaLanguageLinks.length, offset },
      "Transformed videos into media language links for page"
    )

    if (!readOnly) {
      logger?.info("Writing media language links page to database")

      const db = await getDb()

      await Promise.all(
        mediaLanguageLinks.map(async (link) => {
          await db.media_language_links.create({
            data: link,
          })
        })
      )
      logger?.info(
        { count: mediaLanguageLinks.length, offset },
        "Successfully wrote media language links page to database"
      )
    } else {
      logger?.info(
        { count: mediaLanguageLinks.length, offset },
        "Read-only mode - skipping database write for page"
      )
    }

    offset += limit
  }

  logger?.info(
    { totalCount: allMediaLanguageLinks.length },
    "Media language links transformation completed"
  )

  return allMediaLanguageLinks
}
