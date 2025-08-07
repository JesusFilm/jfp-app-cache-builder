import Realm from "realm"

import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"
import { CountryLink } from "../countryLink/realm.js"
import { SuggestedLanguage } from "../suggestedLanguage/realm.js"

import { JFPAppCacheBuilder_iOS_CountryQuery as query } from "./query.js"
import { Country } from "./realm.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformCountries({
  languageId,
  languageTag,
  readOnly = false,
  logger,
}: TransformOptions) {
  const { data } = await client.query({
    query,
    variables: {
      languageId,
    },
  })

  logger?.info({ count: data.countries.length }, "Retrieved countries from API")

  const db = await getDb()

  const countries = data.countries.map((country) => ({
    countryId: country.countryId,
    flagUrlPng: country.flagUrlPng ?? "",
    flagUrlWebPLossy50: country.flagUrlWebPLossy50 ?? "",
    latitude: country.latitude ?? undefined,
    longitude: country.longitude ?? undefined,
    countryPopulation: country.countryPopulation ?? undefined,
    languageCount: country.languageCount,
    languageCountHavingMedia: country.languageCountHavingMedia,
    metadataLanguageTag: languageTag,
    currentDescriptorLanguageId: languageId,
    englishContinentName:
      country.continent.englishContinentName.at(0)?.value ?? "",
    continentName: country.continent.continentName.at(0)?.value ?? "",
    englishName: country.englishName.at(0)?.value ?? "",
    name: country.name.at(0)?.value ?? "",
    languageSpeakerCounts: country.countryLanguages
      .map(({ language }) => {
        return db.objectForPrimaryKey(
          CountryLink,
          `${country.countryId}__${language.id}`
        )
      })
      .filter((link) => link != null),
    suggestedLanguages: country.countryLanguages
      .filter(({ suggested }) => suggested)
      .map(({ language }) => {
        return db.objectForPrimaryKey(
          SuggestedLanguage,
          `${country.countryId}__${language.id}`
        )
      })
      .filter((link) => link != null),
  }))

  if (!readOnly) {
    logger?.info("Writing countries to database")
    db.write(() => {
      countries.forEach((country) => {
        db.create(Country, country, Realm.UpdateMode.Modified)
      })
    })
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
