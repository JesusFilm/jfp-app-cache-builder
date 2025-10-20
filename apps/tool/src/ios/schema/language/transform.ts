import Realm from "realm"

import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_iOS_LanguageQuery as query } from "./query.js"
import { Language } from "./realm.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformLanguages({
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

  logger?.info({ count: data.languages.length }, "Retrieved languages from API")

  const languages = data.languages.map((language) => ({
    languageId: language.id,
    audioPreviewURL: language.audioPreviewURL?.value,
    speakerCount: language.countryLanguages.reduce(
      (acc, countryLanguage) => acc + (countryLanguage.speakerCount ?? 0),
      0 as number
    ),
    iso3: language.iso3 ?? "",
    primaryCountryId:
      language.countryLanguages.find(
        (countryLanguage) => countryLanguage.primary
      )?.country.id ?? "",
    numCountries: language.countryLanguages.length,
    bcp47: language.bcp47 ?? undefined,
    metadataLanguageTag: languageTag,
    currentDescriptorLanguageId: languageId,
    englishName: language.englishName.at(0)?.value ?? "",
    name: language.name.at(0)?.value ?? "",
    nameNative: language.nameNative.at(0)?.value ?? "",
  }))

  if (!readOnly) {
    logger?.info("Writing languages to database")
    const db = await getDb()
    db.write(() => {
      languages.forEach((language) => {
        db.create(Language, language, Realm.UpdateMode.Modified)
      })
    })
    logger?.info(
      { count: languages.length },
      "Successfully wrote languages to database"
    )
  } else {
    logger?.info(
      { count: languages.length },
      "Read-only mode - skipping database write"
    )
  }

  return languages
}
