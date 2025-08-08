import { media_languages as MediaLanguage } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_MediaLanguagesQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformMediaLanguages({
  readOnly = false,
  logger,
}: TransformOptions): Promise<MediaLanguage[]> {
  logger?.info("Starting media languages transformation")

  const { data } = await client.query({
    query,
  })

  logger?.info(
    { count: data.languages.length },
    "Retrieved languages from API for media languages"
  )

  const mediaLanguages: MediaLanguage[] = data.languages.map((language) => {
    // Sum the speaker counts from all country languages
    const speakerCount = language.countryLanguages.reduce(
      (acc, countryLanguage) => acc + (countryLanguage.speakerCount ?? 0),
      0
    )

    // Find the primary country (where primary is true)
    const primaryCountryLanguage = language.countryLanguages.find(
      (countryLanguage) => countryLanguage.primary
    )
    const primaryCountryId = primaryCountryLanguage?.country.id ?? ""

    return {
      mediaLanguageId: language.mediaLanguageId,
      name: language.name[0]?.value ?? "", // Always only one object with value
      nameNative: language.nameNative[0]?.value ?? "", // Always only one object with value
      iso3: language.iso3 ?? "",
      bcp47: language.bcp47 ?? "",
      speakerCount,
      audioPreviewUrl: language.audioPreviewURL?.value ?? null,
      primaryCountryId,
    }
  })

  if (!readOnly) {
    logger?.info("Writing media languages to database")

    const db = await getDb()

    await Promise.all(
      mediaLanguages.map(async (mediaLanguage) => {
        await db.media_languages.create({
          data: mediaLanguage,
        })
      })
    )
    logger?.info(
      { count: mediaLanguages.length },
      "Successfully wrote media languages to database"
    )
  } else {
    logger?.info(
      { count: mediaLanguages.length },
      "Read-only mode - skipping database write"
    )
  }

  return mediaLanguages
}
