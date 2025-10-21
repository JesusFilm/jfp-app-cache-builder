import { media_data as MediaData } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_MediaDataQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformMediaData({
  languageId,
  readOnly = false,
  logger,
}: TransformOptions) {
  logger?.info({ languageId }, "Starting media data transformation")

  const allMediaData: MediaData[] = []
  let offset = 0
  const limit = 100
  let hasMoreData = true

  while (hasMoreData) {
    logger?.info({ offset, limit }, "Fetching media data page")

    const { data } = await client.query({
      query,
      variables: { offset, limit },
    })

    const videos = data.videos
    logger?.info(
      { count: videos.length, offset, limit },
      "Retrieved videos from API for media data"
    )

    if (videos.length === 0) {
      hasMoreData = false
      logger?.info({ offset }, "No more videos to fetch")
      break
    }

    const mediaData: MediaData[] = videos.map((video) => {
      // Determine contentType and componentType based on subType
      const isCollectionOrSeries =
        video.subType === "collection" || video.subType === "series"
      const contentType = isCollectionOrSeries ? 1 : 2
      const componentType = isCollectionOrSeries ? 2 : 1

      // Combine parent and children IDs into a single array
      const parentIds = video.parents?.map((parent) => parent.id) ?? []
      const childrenIds = video.children?.map((child) => child.id) ?? []
      const mediaComponentLinks = [...parentIds, ...childrenIds]

      // Convert imageUrls array to object using reduce
      const imageUrls =
        video.imageUrls?.reduce(
          (acc, image) => {
            if (image.mobileCinematicHigh && !acc["mobileCinematicHigh"]) {
              acc["mobileCinematicHigh"] = image.mobileCinematicHigh
            }
            if (image.mobileCinematicLow && !acc["mobileCinematicLow"]) {
              acc["mobileCinematicLow"] = image.mobileCinematicLow
            }
            if (
              image.mobileCinematicVeryLow &&
              !acc["mobileCinematicVeryLow"]
            ) {
              acc["mobileCinematicVeryLow"] = image.mobileCinematicVeryLow
            }
            if (image.thumbnail && !acc["thumbnail"]) {
              acc["thumbnail"] = image.thumbnail
            }
            if (image.videoStill && !acc["videoStill"]) {
              acc["videoStill"] = image.videoStill
            }
            return acc
          },
          {} as Record<string, string>
        ) ?? {}

      // Get download sizes from variant
      const downloads = video.variant?.downloads ?? []
      const downloadSizes = downloads
        .map((download) => download.size)
        .filter(Boolean)

      // Cap values to fit within INT range (max 2,147,483,647)
      const MAX_INT_VALUE = 2147483647
      const approximateDownloadLowFileSizeInBytes =
        downloadSizes.length > 0
          ? Math.min(Math.min(...downloadSizes), MAX_INT_VALUE)
          : 0
      const approximateDownloadHighFileSizeInBytes =
        downloadSizes.length > 0
          ? Math.min(Math.max(...downloadSizes), MAX_INT_VALUE)
          : 0

      return {
        id: video.id,
        componentType,
        primaryMediaLanguageId: video.primaryMediaLanguageId,
        primaryMediaLanguageName: "",
        subType: video.subType,
        contentType,
        lengthInMilliseconds: video.variant?.lengthInMilliseconds ?? 0,
        isDownloadable: video.variant?.isDownloadable ? 1 : 0,
        languageCount: video.languageCount,
        containsCount: video.containsCount,
        approximateDownloadLowFileSizeInBytes,
        approximateDownloadHighFileSizeInBytes,
        bibleCitations: JSON.stringify(
          video.bibleCitations.map((citation) => ({
            osisId: citation.osisBibleBook,
            chapterStart: citation.chapterStart,
            chapterEnd: citation.chapterEnd,
            verseStart: citation.verseStart,
            verseEnd: citation.verseEnd,
          }))
        ),
        mediaComponentLinks:
          mediaComponentLinks.length > 0
            ? JSON.stringify(mediaComponentLinks)
            : null,
        imageUrls: JSON.stringify(imageUrls),
      }
    })

    allMediaData.push(...mediaData)

    if (!readOnly) {
      logger?.info("Writing media data page to database")

      const db = await getDb()

      // Use createMany for better performance with large batches
      if (mediaData.length > 0) {
        await db.media_data.createMany({
          data: mediaData,
        })
      }

      logger?.info(
        { count: mediaData.length, offset },
        "Successfully wrote media data page to database"
      )
    } else {
      logger?.info(
        { count: mediaData.length, offset },
        "Read-only mode - skipping database write for page"
      )
    }

    offset += limit
  }

  logger?.info(
    { totalCount: allMediaData.length },
    "Media data transformation completed"
  )

  return allMediaData
}
