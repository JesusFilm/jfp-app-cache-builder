import { Buffer } from "buffer"

import Realm from "realm"

import { client } from "../../../lib/client.js"
import { languages } from "../../../lib/languages.js"
import { TransformOptions } from "../../../types/transform.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_iOS_ReadingLanguageDataQuery as query } from "./query.js"
import { ReadingLanguageData } from "./realm.js"

export async function transformReadingLanguageData({
  logger,
}: TransformOptions) {
  const filteredLanguages = languages.filter((language) => language.id !== 529)

  logger?.info(
    { count: filteredLanguages.length },
    "Retrieved languages from lib/languages.ts"
  )

  const readingLanguageDatas = []
  for (const language of filteredLanguages) {
    const languageId = language.id.toString()
    const languageTag = language.tag

    logger?.info(
      { metadataLanguageTag: languageTag, readingLanguageId: languageId },
      "Processing reading language data"
    )

    const { data } = await client.query({
      query,
      variables: {
        languageId,
      },
    })

    logger?.info(
      { metadataLanguageTag: languageTag, readingLanguageId: languageId },
      "Retrieved reading language data from API"
    )

    const readingLanguageData = {
      readingLanguageId: languageId,
      metadataLanguageTag: languageTag,
      bibleCodeData: Buffer.from(
        JSON.stringify(
          data.bibleCodeData.map((obj) => ({
            name: obj.name,
            fullName: obj.fullName.at(0)?.value,
            metadataLanguageTag: languageTag,
          }))
        )
      ),
      countryData: Buffer.from(
        JSON.stringify(
          data.countryData.map((obj) => ({
            name: obj.name.at(-1)?.value ?? "",
            continentName: obj.continent.name.at(-1)?.value ?? "",
            countryId: obj.countryId,
            metadataLanguageTag: languageTag,
          }))
        )
      ),
      languageData: Buffer.from(
        JSON.stringify(
          data.languageData.map((obj) => ({
            name: obj.name.at(-1)?.value ?? obj.nameNative.at(-1)?.value ?? "",
            nameNative: obj.nameNative.at(0)?.value ?? "",
            languageId: obj.languageId,
            metadataLanguageTag: languageTag,
          }))
        )
      ),
      mediaItemData: Buffer.from(
        JSON.stringify(
          data.mediaItemData.map((obj) => ({
            mediaComponentId: obj.mediaComponentId,
            longDescription: obj.longDescription.at(-1)?.value ?? "",
            shortDescription: obj.shortDescription.at(-1)?.value ?? "",
            name: obj.name.at(-1)?.value ?? "",
            metadataLanguageTag: languageTag,
            studyQuestions: obj.studyQuestions.map(
              (question) => question.value
            ),
            bibleCitations: obj.bibleCitations.map((citation) => ({
              osisBibleBook: citation.osisBibleBook,
              verseStart: citation.verseStart,
              verseEnd: citation.verseEnd ?? 0,
              chapterStart: citation.chapterStart,
              chapterEnd: citation.chapterEnd ?? 0,
            })),
          }))
        )
      ),
    }

    logger?.info("Writing reading language data to database", {
      metadataLanguageTag: languageTag,
      readingLanguageId: languageId,
    })
    const db = await getDb()
    db.write(() => {
      db.create(
        ReadingLanguageData,
        readingLanguageData,
        Realm.UpdateMode.Modified
      )
    })
    logger?.info("Successfully wrote reading language data to database", {
      metadataLanguageTag: languageTag,
      readingLanguageId: languageId,
    })

    readingLanguageDatas.push(readingLanguageData)
  }

  return readingLanguageDatas
}
