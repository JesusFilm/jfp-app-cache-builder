import { spoken_languages as SpokenLanguage } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { db } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_SpokenLanguagesQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformSpokenLanguages({
  languageId,
  readOnly = false,
  logger,
}: TransformOptions) {
  logger?.info({ languageId }, "Starting spoken language transformation")

  const { data } = await client.query({
    query,
  })

  logger?.info(
    { count: data.countries.length },
    "Retrieved countries from API for spoken languages"
  )

  // Handle duplicates within each country's countryLanguages array
  const spokenLanguages: SpokenLanguage[] = data.countries.flatMap(
    (country) => {
      // Create a map to handle duplicates within this country's languages
      const countryLanguageMap = new Map<string, SpokenLanguage>()

      for (const countryLanguage of country.countryLanguages) {
        const languageId = countryLanguage.language.id
        const speakerCount = countryLanguage.speakers ?? 0
        const existing = countryLanguageMap.get(languageId)

        // Keep the one with the highest speaker count
        if (!existing || speakerCount > existing.speakerCount) {
          countryLanguageMap.set(languageId, {
            countryId: country.countryId,
            languageId,
            speakerCount,
          })
        }
      }

      return Array.from(countryLanguageMap.values())
    }
  )

  if (!readOnly) {
    logger?.info("Writing spoken languages to database")

    await Promise.all(
      spokenLanguages.map(async (spokenLanguage) => {
        try {
          await db.spoken_languages.create({
            data: spokenLanguage,
          })
        } catch (error) {
          logger?.error(
            { error, spokenLanguage },
            "Error writing spoken language to database"
          )
          throw error
        }
      })
    )
    logger?.info(
      { count: spokenLanguages.length },
      "Successfully wrote spoken languages to database"
    )
  } else {
    logger?.info(
      { count: spokenLanguages.length },
      "Read-only mode - skipping database write"
    )
  }

  return spokenLanguages
}
