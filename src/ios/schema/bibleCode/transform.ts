import Realm from "realm"

import { client } from "../../../lib/client.js"
import { getDb } from "../../lib/db.js"

import { JFPAppCacheBuilder_iOS_BibleCodeQuery as query } from "./query.js"
import { BibleCode } from "./realm.js"

import type { TransformOptions } from "../../../types/transform.js"

export async function transformBibleCodes({
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

  logger?.info(
    { count: data.bibleBooks.length },
    "Retrieved bible codes from API"
  )

  const bibleCodes = data.bibleBooks.map((book) => {
    const fullNameEntry = book.fullName.at(0)
    const englishFullName = book.englishFullName.at(0)?.value ?? ""

    // If fullName is not present, use englishFullName
    const finalFullName = fullNameEntry?.value || englishFullName

    return {
      name: book.name,
      metadataLanguageTag: languageTag,
      currentDescriptorLanguageId: languageId,
      englishFullName,
      fullName: finalFullName,
    }
  })

  if (!readOnly) {
    logger?.info("Writing bible codes to database")
    const db = await getDb()
    db.write(() => {
      bibleCodes.forEach((bibleCode) => {
        db.create(BibleCode, bibleCode, Realm.UpdateMode.Modified)
      })
    })
    logger?.info(
      { count: bibleCodes.length },
      "Successfully wrote bible codes to database"
    )
  } else {
    logger?.info(
      { count: bibleCodes.length },
      "Read-only mode - skipping database write"
    )
  }

  return bibleCodes
}
