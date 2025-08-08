import { media_language_translations as MediaLanguageTranslation } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_MediaLanguageTranslationsQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformMediaLanguageTranslations({
  languageId,
  languageTag,
  readOnly = false,
  logger,
}: TransformOptions): Promise<MediaLanguageTranslation[]> {
  logger?.info(
    { languageId, languageTag },
    "Starting media language translations transformation"
  )

  const { data } = await client.query({
    query,
    variables: {},
  })

  logger?.info(
    { count: data.languages.length },
    "Retrieved languages from API for media language translations"
  )

  const mediaLanguageTranslations: MediaLanguageTranslation[] =
    data.languages.flatMap((language) =>
      language.name
        .filter(
          (nameTranslation) => nameTranslation.language.metadataLanguageTag
        )
        .map((nameTranslation) => ({
          languageId: language.id,
          name: nameTranslation.value,
          metadataLanguageTag: nameTranslation.language.metadataLanguageTag!,
        }))
    )

  if (!readOnly) {
    logger?.info("Writing media language translations to database")

    const db = await getDb()

    await Promise.all(
      mediaLanguageTranslations.map(async (translation) => {
        await db.media_language_translations.create({
          data: translation,
        })
      })
    )
    logger?.info(
      { count: mediaLanguageTranslations.length },
      "Successfully wrote media language translations to database"
    )
  } else {
    logger?.info(
      { count: mediaLanguageTranslations.length },
      "Read-only mode - skipping database write"
    )
  }

  return mediaLanguageTranslations
}
