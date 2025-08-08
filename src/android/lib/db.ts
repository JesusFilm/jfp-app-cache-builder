import { promises as fs } from "fs"
import path from "path"
import process from "process"

import { Logger } from "pino"

import { PrismaClient } from "../../__generated__/prisma/index.js"

export const db = new PrismaClient()

interface CleanupOptions {
  logger?: Logger | undefined
  cleanDbPath?: string
}

export async function cleanup({ logger, cleanDbPath }: CleanupOptions) {
  if (!cleanDbPath) {
    cleanDbPath = path.join(process.cwd(), "assets", "android", "cache.db")
  }

  logger?.info?.({ cleanDbPath }, "Starting cleanup of Android database")

  try {
    await fs.access(cleanDbPath)
  } catch {
    throw new Error(`Clean database file not found at: ${cleanDbPath}`)
  }

  // Create a new Prisma client instance pointing to the clean database
  const db = new PrismaClient({
    datasources: {
      db: {
        url: `file:${cleanDbPath}`,
      },
    },
  })

  // Check if there's any data to clean, and only perform deletes if needed
  const [
    mediaMetadataCount,
    mediaLanguageLinksCount,
    mediaLanguageTranslationsCount,
    termTranslationsCount,
    spokenLanguagesCount,
    suggestedLanguagesCount,
    countryTranslationsCount,
    mediaDataCount,
    mediaLanguagesCount,
    readingLanguagesCount,
    countriesCount,
  ] = await Promise.all([
    db.media_metadata.count(),
    db.media_language_links.count(),
    db.media_language_translations.count(),
    db.term_translations.count(),
    db.spoken_languages.count(),
    db.suggested_languages.count(),
    db.country_translations.count(),
    db.media_data.count(),
    db.media_languages.count(),
    db.reading_languages.count(),
    db.countries.count(),
  ])

  const hasData =
    mediaMetadataCount > 0 ||
    mediaLanguageLinksCount > 0 ||
    mediaLanguageTranslationsCount > 0 ||
    termTranslationsCount > 0 ||
    spokenLanguagesCount > 0 ||
    suggestedLanguagesCount > 0 ||
    countryTranslationsCount > 0 ||
    mediaDataCount > 0 ||
    mediaLanguagesCount > 0 ||
    readingLanguagesCount > 0 ||
    countriesCount > 0

  if (hasData) {
    logger?.info?.("Found data to clean, performing delete operations")

    // Delete all rows from all Android tables in the correct order
    // (respecting foreign key constraints)

    // First, delete tables that may have foreign key references
    if (mediaMetadataCount > 0) {
      await db.media_metadata.deleteMany({})
      logger?.info?.(`Cleaned ${mediaMetadataCount} media_metadata records`)
    }

    if (mediaLanguageLinksCount > 0) {
      await db.media_language_links.deleteMany({})
      logger?.info?.(
        `Cleaned ${mediaLanguageLinksCount} media_language_links records`
      )
    }

    if (mediaLanguageTranslationsCount > 0) {
      await db.media_language_translations.deleteMany({})
      logger?.info?.(
        `Cleaned ${mediaLanguageTranslationsCount} media_language_translations records`
      )
    }

    if (termTranslationsCount > 0) {
      await db.term_translations.deleteMany({})
      logger?.info?.(
        `Cleaned ${termTranslationsCount} term_translations records`
      )
    }

    if (spokenLanguagesCount > 0) {
      await db.spoken_languages.deleteMany({})
      logger?.info?.(`Cleaned ${spokenLanguagesCount} spoken_languages records`)
    }

    if (suggestedLanguagesCount > 0) {
      await db.suggested_languages.deleteMany({})
      logger?.info?.(
        `Cleaned ${suggestedLanguagesCount} suggested_languages records`
      )
    }

    if (countryTranslationsCount > 0) {
      await db.country_translations.deleteMany({})
      logger?.info?.(
        `Cleaned ${countryTranslationsCount} country_translations records`
      )
    }

    // Then delete the main tables
    if (mediaDataCount > 0) {
      await db.media_data.deleteMany({})
      logger?.info?.(`Cleaned ${mediaDataCount} media_data records`)
    }

    if (mediaLanguagesCount > 0) {
      await db.media_languages.deleteMany({})
      logger?.info?.(`Cleaned ${mediaLanguagesCount} media_languages records`)
    }

    if (readingLanguagesCount > 0) {
      await db.reading_languages.deleteMany({})
      logger?.info?.(
        `Cleaned ${readingLanguagesCount} reading_languages records`
      )
    }

    if (countriesCount > 0) {
      await db.countries.deleteMany({})
      logger?.info?.(`Cleaned ${countriesCount} countries records`)
    }
  } else {
    logger?.info?.("No data found in database, skipping cleanup operations")
  }

  // Disconnect the clean database
  await db.$disconnect()

  logger?.info?.(
    { cleanDbPath },
    "Successfully cleaned all Android database tables"
  )
}

interface RebuildOptions {
  logger?: Logger | undefined
}

export async function rebuild({ logger }: RebuildOptions) {
  logger?.info?.("Starting rebuild of Android database from clean files")

  // Define the assets directory and clean file paths
  const assetsDir = path.join(process.cwd(), "assets", "android")
  const cleanDbPath = path.join(assetsDir, "cache.clean.db")
  const targetDbPath = path.join(assetsDir, "cache.db")

  // Run cleanup to ensure database connections are properly closed
  logger?.info?.("Running cleanup before file operations")
  await cleanup({ logger, cleanDbPath })

  // Read all files in the assets directory and remove everything except .clean files and .gitkeep
  const files = await fs.readdir(assetsDir)

  for (const file of files) {
    const filePath = path.join(assetsDir, file)

    // Skip .gitkeep and cache.clean.db files
    if (file === ".gitkeep" || file === "cache.clean.db") {
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
  await fs.copyFile(cleanDbPath, targetDbPath)
  logger?.info?.("Copied cache.clean.db to cache.db")

  logger?.info?.("Successfully rebuilt Android database from clean files")
}
