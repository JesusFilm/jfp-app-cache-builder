import { promises as fs } from "fs"
import path from "path"
import process from "process"

import Realm from "realm"

import { BibleCode } from "../schema/bibleCode/realm.js"
import { ContainedByMediaLink } from "../schema/containedByMediaLink/realm.js"
import { Country } from "../schema/country/realm.js"
import { CountryLink } from "../schema/countryLink/realm.js"
import { Etag } from "../schema/etag/realm.js"
import { Language } from "../schema/language/realm.js"
import { MediaCategory } from "../schema/mediaCategory/realm.js"
import { MediaItem } from "../schema/mediaItem/realm.js"
import { ReadingLanguageData } from "../schema/readingLanguageData/realm.js"
import { SuggestedLanguage } from "../schema/suggestedLanguage/realm.js"

import type { Logger } from "pino"

let _db: Realm | null = null

export async function getDb(
  dbPath = path.join(process.cwd(), "assets", "ios", "arclight.realm"),
  ignoreCache = false
): Promise<Realm> {
  let db = _db
  if (!db || ignoreCache) {
    db = await Realm.open({
      path: dbPath,
      schema: [
        BibleCode,
        ContainedByMediaLink,
        Country,
        CountryLink,
        Etag,
        Language,
        MediaCategory,
        MediaItem,
        ReadingLanguageData,
        SuggestedLanguage,
      ],
    })
  }

  if (ignoreCache) {
    return db
  } else {
    _db = db
    return _db
  }
}

interface CleanupOptions {
  logger?: Logger | undefined
  cleanRealmPath?: string
}

export async function cleanup({ logger, cleanRealmPath }: CleanupOptions) {
  if (!cleanRealmPath) {
    cleanRealmPath = path.join(process.cwd(), "assets", "ios", "arclight.realm")
  }

  logger?.info?.({ cleanRealmPath }, "Starting cleanup of iOS database")

  // Check if clean file exists
  try {
    await fs.access(cleanRealmPath)
  } catch {
    throw new Error(`Clean Realm file not found at: ${cleanRealmPath}`)
  }

  // Open the clean database file directly
  const db = await getDb(cleanRealmPath, true)

  // Check if there's any data to clean, and only write if needed
  const containedByMediaLinks = db.objects(ContainedByMediaLink)
  const readingLanguageData = db.objects(ReadingLanguageData)
  const mediaItems = db.objects(MediaItem)
  const countries = db.objects(Country)
  const bibleCodes = db.objects(BibleCode)
  const countryLinks = db.objects(CountryLink)
  const etags = db.objects(Etag)
  const languages = db.objects(Language)
  const mediaCategories = db.objects(MediaCategory)
  const suggestedLanguages = db.objects(SuggestedLanguage)

  const hasData =
    containedByMediaLinks.length > 0 ||
    readingLanguageData.length > 0 ||
    mediaItems.length > 0 ||
    countries.length > 0 ||
    bibleCodes.length > 0 ||
    countryLinks.length > 0 ||
    etags.length > 0 ||
    languages.length > 0 ||
    mediaCategories.length > 0 ||
    suggestedLanguages.length > 0

  if (hasData) {
    logger?.info?.("Found data to clean, performing delete operations")

    // Delete all rows from all tables in the database
    db.write(() => {
      // First, delete tables that may have foreign key references or relationships
      // Delete ContainedByMediaLink first as it references MediaItem
      if (containedByMediaLinks.length > 0) {
        logger?.info?.(
          `Cleaning ${containedByMediaLinks.length} ContainedByMediaLink records`
        )
        db.delete(containedByMediaLinks)
      }

      // Delete ReadingLanguageData (contains Buffer data)
      if (readingLanguageData.length > 0) {
        logger?.info?.(
          `Cleaning ${readingLanguageData.length} ReadingLanguageData records`
        )
        db.delete(readingLanguageData)
      }

      // Delete MediaItem (may be referenced by ContainedByMediaLink)
      if (mediaItems.length > 0) {
        logger?.info?.(`Cleaning ${mediaItems.length} MediaItem records`)
        db.delete(mediaItems)
      }

      // Delete Country (contains lists of CountryLink and SuggestedLanguage)
      if (countries.length > 0) {
        logger?.info?.(`Cleaning ${countries.length} Country records`)
        db.delete(countries)
      }

      // Delete standalone tables
      if (bibleCodes.length > 0) {
        logger?.info?.(`Cleaning ${bibleCodes.length} BibleCode records`)
        db.delete(bibleCodes)
      }

      if (countryLinks.length > 0) {
        logger?.info?.(`Cleaning ${countryLinks.length} CountryLink records`)
        db.delete(countryLinks)
      }

      if (etags.length > 0) {
        logger?.info?.(`Cleaning ${etags.length} Etag records`)
        db.delete(etags)
      }

      if (languages.length > 0) {
        logger?.info?.(`Cleaning ${languages.length} Language records`)
        db.delete(languages)
      }

      if (mediaCategories.length > 0) {
        logger?.info?.(
          `Cleaning ${mediaCategories.length} MediaCategory records`
        )
        db.delete(mediaCategories)
      }

      if (suggestedLanguages.length > 0) {
        logger?.info?.(
          `Cleaning ${suggestedLanguages.length} SuggestedLanguage records`
        )
        db.delete(suggestedLanguages)
      }
    })
  } else {
    logger?.info?.("No data found in database, skipping cleanup operations")
  }

  // Close the clean database
  db.close()

  logger?.info?.(
    { cleanRealmPath },
    "Successfully cleaned all iOS database tables"
  )
}

interface RebuildOptions {
  logger?: Logger | undefined
}

export async function rebuild({ logger }: RebuildOptions) {
  logger?.info?.("Starting rebuild of iOS database from clean files")

  // Define the assets directory and clean file paths
  const assetsDir = path.join(process.cwd(), "assets", "ios")
  const cleanRealmPath = path.join(assetsDir, "arclight.clean.realm")
  const targetRealmPath = path.join(assetsDir, "arclight.realm")

  // Run cleanup to ensure database connections are properly closed
  logger?.info?.("Running cleanup before file operations")
  await cleanup({ logger, cleanRealmPath })

  // Read all files in the assets directory and remove everything except .clean files and .gitkeep
  const files = await fs.readdir(assetsDir)

  for (const file of files) {
    const filePath = path.join(assetsDir, file)

    // Skip .gitkeep and arclight.clean.realm files
    if (file === ".gitkeep" || file === "arclight.clean.realm") {
      logger?.info?.(`Skipping protected file: ${file}`)
      continue
    }

    try {
      const stat = await fs.stat(filePath)

      if (stat.isDirectory()) {
        // Remove directory recursively
        await fs.rm(filePath, { recursive: true, force: true })
        logger?.info?.(`Removed directory: ${file}`)
      } else {
        // Remove file
        await fs.unlink(filePath)
        logger?.info?.(`Removed file: ${file}`)
      }
    } catch (error) {
      logger?.warn?.(
        `Failed to remove ${file}:`,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  // Copy clean file to target location
  await fs.copyFile(cleanRealmPath, targetRealmPath)
  logger?.info?.("Copied arclight.clean.realm to arclight.realm")

  logger?.info?.("Successfully rebuilt iOS database from clean files")
}
