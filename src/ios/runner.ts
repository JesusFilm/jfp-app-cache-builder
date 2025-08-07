import { RunnerOptions, TransformOptions } from "../types/transform.js"

import { rebuild } from "./lib/db.js"
import { transformBibleCodes } from "./schema/bibleCode/transform.js"
import { transformContainedByMediaLinks } from "./schema/containedByMediaLink/transform.js"
import { transformCountries } from "./schema/country/transform.js"
import { transformCountryLinks } from "./schema/countryLink/transform.js"
import { transformLanguages } from "./schema/language/transform.js"
import { transformMediaCategories } from "./schema/mediaCategory/transform.js"
import { transformMediaItems } from "./schema/mediaItem/transform.js"
import { transformReadingLanguageData } from "./schema/readingLanguageData/transform.js"
import { transformSuggestedLanguages } from "./schema/suggestedLanguage/transform.js"

export async function runner({
  languageId,
  languageTag,
  logger,
  includeReadingLanguageData = false,
  readOnly = false,
}: RunnerOptions): Promise<void> {
  logger?.info("Starting iOS data transformation process")

  if (!readOnly) {
    // Clean all tables at the beginning
    await rebuild({ logger })
  } else {
    logger?.info("Running in read-only mode")
  }

  const transformers: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (options: TransformOptions) => Promise<any[]>,
    name: string,
  ][] = [
    [transformBibleCodes, "bibleCodes"],
    [transformCountryLinks, "countryLinks"],
    [transformLanguages, "languages"],
    [transformSuggestedLanguages, "suggestedLanguages"],
    [transformCountries, "countries"],
    [transformMediaCategories, "mediaCategories"],
    [transformMediaItems, "mediaItems"],
    [transformContainedByMediaLinks, "containedByMediaLinks"],
  ]

  // Add reading language data transformer if requested
  if (includeReadingLanguageData) {
    transformers.push([transformReadingLanguageData, "readingLanguageData"])
  }

  for (const [transformer, name] of transformers) {
    logger?.info(`Transforming ${name}`)

    const transformOptions: TransformOptions = {
      languageId,
      languageTag,
    }

    if (readOnly) {
      transformOptions.readOnly = readOnly
    }

    if (logger) {
      transformOptions.logger = logger.child({
        transformer: name,
        languageId,
        languageTag,
      })
    }

    await transformer(transformOptions)
    logger?.info(`Transformed ${name}`)
  }

  logger?.info("iOS data transformation completed successfully")
}
