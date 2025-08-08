import { reading_languages as ReadingLanguage } from "../../../__generated__/prisma/index.js"
import { languages } from "../../../lib/languages.js"
import { getDb } from "../../lib/db.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformReadingLanguages({
  readOnly = false,
  logger,
}: TransformOptions): Promise<ReadingLanguage[]> {
  logger?.info("Starting reading languages transformation")

  logger?.info(
    { count: languages.length },
    "Retrieved languages from lib/languages.ts"
  )

  const readingLanguages: ReadingLanguage[] = languages.map((language) => ({
    id: language.tag,
    name: language.name,
    nativeName: language.nameNative,
  }))

  if (!readOnly) {
    logger?.info("Writing reading languages to database")

    const db = await getDb()

    await Promise.all(
      readingLanguages.map(async (readingLanguage) => {
        await db.reading_languages.create({
          data: readingLanguage,
        })
      })
    )
    logger?.info(
      { count: readingLanguages.length },
      "Successfully wrote reading languages to database"
    )
  } else {
    logger?.info(
      { count: readingLanguages.length },
      "Read-only mode - skipping database write"
    )
  }

  return readingLanguages
}
