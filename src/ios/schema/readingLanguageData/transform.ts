import { Buffer } from "buffer"

import Realm from "realm"

import { languages } from "../../../lib/languages.js"
import { TransformOptions } from "../../../types/transform.js"
import { getDb } from "../../lib/db.js"
import { transformBibleCodes } from "../bibleCode/transform.js"
import { transformCountryLinks } from "../countryLink/transform.js"
import { transformLanguages } from "../language/transform.js"
import { transformMediaItems } from "../mediaItem/transform.js"

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

    const readingLanguageData = {
      readingLanguageId: languageId,
      metadataLanguageTag: languageTag,
      bibleCodeData: Buffer.from(
        JSON.stringify(
          await transformBibleCodes({
            languageId,
            languageTag,
            readOnly: true,
            logger: logger?.child({
              subTransformer: "bibleCodes",
              languageId,
              languageTag,
            }),
          })
        )
      ),
      countryData: Buffer.from(
        JSON.stringify(
          await transformCountryLinks({
            languageId,
            languageTag,
            readOnly: true,
            logger: logger?.child({
              subTransformer: "countryLinks",
              languageId,
              languageTag,
            }),
          })
        )
      ),
      languageData: Buffer.from(
        JSON.stringify(
          await transformLanguages({
            languageId,
            languageTag,
            readOnly: true,
            logger: logger?.child({
              subTransformer: "languages",
              languageId,
              languageTag,
            }),
          })
        )
      ),
      mediaItemData: Buffer.from(
        JSON.stringify(
          await transformMediaItems({
            languageId,
            languageTag,
            readOnly: true,
            logger: logger?.child({
              subTransformer: "mediaItems",
              languageId,
              languageTag,
            }),
          })
        )
      ),
    }

    logger?.info("Writing reading language data to database")
    const db = await getDb()
    db.write(() => {
      db.create(
        ReadingLanguageData,
        readingLanguageData,
        Realm.UpdateMode.Modified
      )
    })
    logger?.info("Successfully wrote reading language data to database")

    readingLanguageDatas.push(readingLanguageData)
  }

  return readingLanguageDatas
}
