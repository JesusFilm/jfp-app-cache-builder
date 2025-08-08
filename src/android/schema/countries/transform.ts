import { countries as Country } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_CountriesQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformCountries({
  languageId,
  readOnly = false,
  logger,
}: TransformOptions) {
  logger?.info({ languageId }, "Starting countries transformation")

  const { data } = await client.query({
    query,
    variables: {
      languageId,
    },
  })

  logger?.info({ count: data.countries.length }, "Retrieved countries from API")

  const countries: Country[] = data.countries.map((country) => ({
    countryId: country.countryId,
    name: country.name.at(0)?.value ?? "",
    continentName: country.continent.continentName.at(0)?.value ?? "",
    languageHavingMediaCount: country.languageHavingMediaCount,
    population: country.population ?? 0,
    longitude: country.longitude ?? 0,
    latitude: country.latitude ?? 0,
    flagLossyWeb: country.flagLossyWeb,
    flagPng8: country.flagPng8,
  }))

  if (!readOnly) {
    logger?.info("Writing countries to database")

    const db = await getDb()

    // Use createMany for better performance with large batches
    if (countries.length > 0) {
      await db.countries.createMany({
        data: countries,
      })
    }
    logger?.info(
      { count: countries.length },
      "Successfully wrote countries to database"
    )
  } else {
    logger?.info(
      { count: countries.length },
      "Read-only mode - skipping database write"
    )
  }

  return countries
}
