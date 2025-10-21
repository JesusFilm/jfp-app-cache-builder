import Realm from "realm"

import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_iOS_CountryLinkQuery as query } from "./query.js"
import { CountryLink } from "./realm.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformCountryLinks({
  readOnly = false,
  logger,
}: TransformOptions) {
  const { data } = await client.query({
    query,
  })

  logger?.info(
    { count: data.countries.length },
    "Retrieved countries from API for country links"
  )

  const countryLinks = data.countries.flatMap((country) =>
    country.countryLanguages.map((countryLanguage) => ({
      countryLanguageId: `${country.id}__${countryLanguage.language.id}`,
      languageId: parseInt(countryLanguage.language.id),
      speakerCount: countryLanguage.speakerCount ?? 0,
    }))
  )

  if (!readOnly) {
    logger?.info("Writing country links to database")
    const db = await getDb()
    db.write(() => {
      countryLinks.forEach((countryLink) => {
        db.create(CountryLink, countryLink, Realm.UpdateMode.Modified)
      })
    })
    logger?.info(
      { count: countryLinks.length },
      "Successfully wrote country links to database"
    )
  } else {
    logger?.info(
      { count: countryLinks.length },
      "Read-only mode - skipping database write"
    )
  }

  return countryLinks
}
