import { Buffer } from "buffer"

import Realm from "realm"

import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_iOS_MediaItemQuery as query } from "./query.js"
import { MediaItem } from "./realm.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformMediaItems({
  languageId,
  languageTag,
  readOnly = false,
  logger,
}: TransformOptions) {
  const limit = 100
  let offset = 0
  let lastPage = false
  const allMediaItems = []

  while (!lastPage) {
    const { data } = await client.query({
      query,
      variables: {
        limit,
        offset,
        languageId,
      },
    })

    if (data.videos.length === 0) {
      lastPage = true
      break
    }

    logger?.info(
      { offset, count: data.videos.length },
      "Retrieved media items from API"
    )

    const mediaItems = data.videos.map((video) => {
      const image = video.images?.[0]
      const longDescription = video.longDescription?.[0]
      const shortDescription = video.shortDescription?.[0]
      const name = video.name?.[0]
      const englishLongDescription = video.englishLongDescription?.[0]
      const englishShortDescription = video.englishShortDescription?.[0]
      const englishName = video.englishName?.[0]

      return {
        mediaComponentId: video.id,
        languageCount: video.languageCount ?? 0,
        sort: "",
        primaryLanguageId: video.primaryLanguageId ?? "",
        componentType: ["collection", "series"].includes(video.subType)
          ? "container"
          : "content",
        contentType: ["collection", "series"].includes(video.subType)
          ? "none"
          : "video",
        lengthInSeconds: video.variant?.lengthInSeconds ?? 0,
        approxLargeDownloadSize:
          video.variant?.downloads?.find((d) => d.quality === "high")
            ?.approxDownloadSize ?? undefined,
        approxSmallDownloadSize:
          video.variant?.downloads?.find((d) => d.quality === "low")
            ?.approxDownloadSize ?? undefined,
        highResImageUrl: image?.highResImageUrl ?? "",
        lowResImageUrl: image?.lowResImageUrl ?? "",
        veryLowResImageUrl: image?.veryLowResImageUrl ?? "",
        thumbnailUrl: image?.thumbnailUrl ?? "",
        videoStillUrl: image?.videoStillUrl ?? "",
        isDownloadable: video.variant?.isDownloadable ?? false,
        languageIds:
          video.languageIds?.map(({ id }) => `|${id}|`).join(",") ?? "",
        subType: video.subType ?? "",
        groupContentCount: video.groupContentCount ?? 0,
        currentDescriptorLanguageId: languageId,
        metadataLanguageTag: languageTag,
        englishLongDescription: englishLongDescription?.value ?? "",
        longDescription: longDescription?.value ?? "",
        englishShortDescription: englishShortDescription?.value ?? "",
        shortDescription: shortDescription?.value ?? "",
        englishName: englishName?.value ?? "",
        name: name?.value ?? "",
        englishBibleCitationsData:
          video.bibleCitationsData.length > 0
            ? Buffer.from(
                JSON.stringify(
                  video.bibleCitationsData.map((citation) => ({
                    osisBibleBook: citation.osisBibleBook,
                    verseStart: citation.verseStart,
                    verseEnd: citation.verseEnd,
                    chapterStart: citation.chapterStart,
                    chapterEnd: citation.chapterEnd,
                  }))
                ),
                "utf-8"
              )
            : undefined,
        bibleCitationsData:
          video.bibleCitationsData.length > 0
            ? Buffer.from(
                JSON.stringify(
                  video.bibleCitationsData.map((citation) => ({
                    osisBibleBook: citation.osisBibleBook,
                    verseStart: citation.verseStart,
                    verseEnd: citation.verseEnd,
                    chapterStart: citation.chapterStart,
                    chapterEnd: citation.chapterEnd,
                  }))
                ),
                "utf-8"
              )
            : undefined,
        englishStudyQuestionsData:
          video.englishStudyQuestionsData.length > 0
            ? Buffer.from(
                JSON.stringify(
                  video.englishStudyQuestionsData.map(({ value }) => ({
                    studyQuestion: value,
                  }))
                ),
                "utf-8"
              )
            : undefined,
        studyQuestionsData:
          video.studyQuestionsData.length > 0
            ? Buffer.from(
                JSON.stringify(
                  video.studyQuestionsData.map(({ value }) => ({
                    studyQuestion: value,
                  }))
                ),
                "utf-8"
              )
            : undefined,
      }
    })

    allMediaItems.push(...mediaItems)

    if (!readOnly) {
      logger?.info("Writing media items to database")
      const db = await getDb()
      db.write(() => {
        mediaItems.forEach((mediaItem) => {
          db.create(MediaItem, mediaItem, Realm.UpdateMode.Modified)
        })
      })
      logger?.info(
        { count: mediaItems.length },
        "Successfully wrote media items to database"
      )
    } else {
      logger?.info(
        { count: mediaItems.length },
        "Read-only mode - skipping database write"
      )
    }

    offset += limit
  }

  return allMediaItems
}
