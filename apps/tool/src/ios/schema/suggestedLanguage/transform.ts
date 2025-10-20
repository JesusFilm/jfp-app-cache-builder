import Realm from "realm"

import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_iOS_SuggestedLanguageQuery as query } from "./query.js"
import { SuggestedLanguage } from "./realm.js"

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

  const suggestedLanguages = data.countries.flatMap((country) =>
    country.countryLanguages
      .filter((countryLanguage) => countryLanguage.suggested)
      .map((countryLanguage) => ({
        countryLanguageId: `${country.id}__${countryLanguage.language.id}`,
        languageId: parseInt(countryLanguage.language.id),
        languageRank: countryLanguage.languageRank ?? 0,
      }))
  )

  if (!readOnly) {
    logger?.info("Writing suggested languages to database")
    const db = await getDb()
    db.write(() => {
      suggestedLanguages.forEach((suggestedLanguage) => {
        db.create(
          SuggestedLanguage,
          suggestedLanguage,
          Realm.UpdateMode.Modified
        )
      })
    })
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
