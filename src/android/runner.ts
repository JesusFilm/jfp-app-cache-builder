import { rebuild } from "./lib/db.js"
import { transformCountries } from "./schema/countries/transform.js"
import { transformCountryTranslations } from "./schema/countryTranslations/transform.js"
import { transformMediaData } from "./schema/mediaData/transform.js"
import { transformMediaLanguageLinks } from "./schema/mediaLanguageLinks/transform.js"
import { transformMediaLanguages } from "./schema/mediaLanguages/transform.js"
import { transformMediaLanguageTranslations } from "./schema/mediaLanguageTranslations/transform.js"
import { transformMediaMetadata } from "./schema/mediaMetadata/transform.js"
import { transformReadingLanguages } from "./schema/readingLanguages/transform.js"
import { transformSpokenLanguages } from "./schema/spokenLanguages/transform.js"
import { transformSuggestedLanguages } from "./schema/suggestedLanguages/transform.js"
import { transformTermTranslations } from "./schema/termTranslations/transform.js"

import type { RunnerOptions, TransformOptions } from "../types/transform.js"

export async function runner({
  languageId,
  languageTag,
  logger,
  readOnly = false,
}: RunnerOptions): Promise<void> {
  logger?.info("Starting Android data transformation process")

  if (!readOnly) {
    // Rebuild all tables at the beginning
    await rebuild({ logger })
  } else {
    logger?.info("Running in read-only mode")
  }

  const transformers: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (options: TransformOptions) => Promise<any[]>,
    name: string,
  ][] = [
    [transformCountries, "countries"],
    [transformCountryTranslations, "countryTranslations"],
    [transformMediaData, "mediaData"],
    [transformMediaLanguages, "mediaLanguages"],
    [transformMediaLanguageLinks, "mediaLanguageLinks"],
    [transformMediaLanguageTranslations, "mediaLanguageTranslations"],
    [transformMediaMetadata, "mediaMetadata"],
    [transformSpokenLanguages, "spokenLanguages"],
    [transformSuggestedLanguages, "suggestedLanguages"],
    [transformTermTranslations, "termTranslations"],
    [transformReadingLanguages, "readingLanguages"],
  ]

  for (const [transformer, name] of transformers) {
    logger?.info(`Transforming ${name}`)
    await transformer({
      languageId,
      languageTag,
      logger: logger?.child({ transformer: name, languageId, languageTag }),
      readOnly,
    })
    logger?.info(`Transformed ${name}`)
  }

  logger?.info("Android data transformation completed successfully")
}
