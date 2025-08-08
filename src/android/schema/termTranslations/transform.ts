import { term_translations as TermTranslation } from "../../../__generated__/prisma/index.js"
import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_Android_TermTranslationsQuery as query } from "./query.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformTermTranslations({
  readOnly = false,
  logger,
}: TransformOptions): Promise<TermTranslation[]> {
  logger?.info("Starting term translations transformation")

  const { data } = await client.query({
    query,
  })

  logger?.info(
    { count: data.taxonomies.length },
    "Retrieved taxonomies from API for term translations"
  )

  const termTranslations: TermTranslation[] = data.taxonomies.flatMap(
    (taxonomy) =>
      taxonomy.term
        .filter((termTranslation) => termTranslation.language.languageTag)
        .map((termTranslation) => ({
          languageTag: termTranslation.language.languageTag!,
          label: taxonomy.label,
          term: termTranslation.value,
        }))
  )

  if (!readOnly) {
    logger?.info("Writing term translations to database")

    const db = await getDb()

    await Promise.all(
      termTranslations.map(async (termTranslation) => {
        await db.term_translations.create({
          data: termTranslation,
        })
      })
    )
    logger?.info(
      { count: termTranslations.length },
      "Successfully wrote term translations to database"
    )
  } else {
    logger?.info(
      { count: termTranslations.length },
      "Read-only mode - skipping database write"
    )
  }

  return termTranslations
}
