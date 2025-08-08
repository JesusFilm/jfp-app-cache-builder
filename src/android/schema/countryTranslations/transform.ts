import { country_translations as CountryTranslation } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_CountryTranslationsQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformCountryTranslations({
  languageId,
  languageTag,
  readOnly = false,
  logger,
}: TransformOptions) {
  logger?.info(
    { languageId, languageTag },
    "Starting country translations transformation"
  )

  const { data } = await client.query({
    query,
  })

  logger?.info(
    { count: data.countries.length },
    "Retrieved countries from API for country translations"
  )

  const countryTranslations: CountryTranslation[] = data.countries.flatMap(
    (country) =>
      country.name
        .filter((nameTranslation) => nameTranslation.language.bcp47)
        .map((nameTranslation) => ({
          countryId: country.countryId,
          name: nameTranslation.value,
          languageTag: nameTranslation.language.bcp47!,
        }))
  )

  if (!readOnly) {
    logger?.info("Writing country translations to database")

    const db = await getDb()

    // Use createMany for better performance with large batches
    if (countryTranslations.length > 0) {
      await db.country_translations.createMany({
        data: countryTranslations,
      })
    }
    logger?.info(
      { count: countryTranslations.length },
      "Successfully wrote country translations to database"
    )
  } else {
    logger?.info(
      { count: countryTranslations.length },
      "Read-only mode - skipping database write"
    )
  }

  return countryTranslations
}
