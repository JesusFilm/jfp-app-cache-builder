import { suggested_languages as SuggestedLanguage } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_SuggestedLanguagesQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformSuggestedLanguages({
  languageId,
  readOnly = false,
  logger,
}: TransformOptions) {
  logger?.info({ languageId }, "Starting suggested language transformation")

  const { data } = await client.query({
    query,
  })

  logger?.info(
    { count: data.countries.length },
    "Retrieved countries from API for suggested languages"
  )

  const suggestedLanguages: SuggestedLanguage[] = data.countries.flatMap(
    (country) =>
      country.countryLanguages
        .filter((countryLanguage) => countryLanguage.suggested)
        .map((countryLanguage) => ({
          countryId: country.countryId,
          languageId: countryLanguage.language.id,
          languageRank: countryLanguage.languageRank ?? 0,
        }))
  )

  if (!readOnly) {
    logger?.info("Writing suggested languages to database")

    const db = await getDb()

    // Use createMany for better performance with large batches
    if (suggestedLanguages.length > 0) {
      await db.suggested_languages.createMany({
        data: suggestedLanguages,
      })
    }

    logger?.info(
      { count: suggestedLanguages.length },
      "Successfully wrote suggested languages to database"
    )
  } else {
    logger?.info(
      { count: suggestedLanguages.length },
      "Read-only mode - skipping database write"
    )
  }

  return suggestedLanguages
}
