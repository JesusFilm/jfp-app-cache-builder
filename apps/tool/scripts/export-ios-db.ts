import { promises as fs } from "fs"
import path from "path"
import process from "process"

import Realm from "realm"

// Import all Realm schemas
import { BibleCode } from "../src/ios/schema/bibleCode/realm.js"
import { ContainedByMediaLink } from "../src/ios/schema/containedByMediaLink/realm.js"
import { Country } from "../src/ios/schema/country/realm.js"
import { CountryLink } from "../src/ios/schema/countryLink/realm.js"
import { Etag } from "../src/ios/schema/etag/realm.js"
import { Language } from "../src/ios/schema/language/realm.js"
import { MediaCategory } from "../src/ios/schema/mediaCategory/realm.js"
import { MediaItem } from "../src/ios/schema/mediaItem/realm.js"
import { ReadingLanguageData } from "../src/ios/schema/readingLanguageData/realm.js"
import { SuggestedLanguage } from "../src/ios/schema/suggestedLanguage/realm.js"

interface SchemaInfo {
  name: string
  properties: Array<{
    name: string
    type: string
    optional: boolean
    primaryKey?: boolean
  }>
  objectCount: number
}

// Helper function to convert Buffer to base64 string
function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64")
}

// Helper function to convert Realm object to plain object, handling Buffers
function realmObjectToPlain(obj: any): any {
  const plain: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof ArrayBuffer) {
      plain[key] = bufferToBase64(value)
    } else if (value instanceof Realm.List) {
      plain[key] = Array.from(value).map((item: any) =>
        typeof item === "object" ? realmObjectToPlain(item) : item
      )
    } else if (typeof value === "object" && value !== null) {
      plain[key] = realmObjectToPlain(value)
    } else {
      plain[key] = value
    }
  }

  return plain
}

async function exportIOSDatabase() {
  const dbPath = path.join(process.cwd(), "assets", "ios", "cache.realm")
  const outputDir = path.join(
    process.cwd(),
    "..",
    "website",
    "src",
    "lib",
    "ios",
    "data"
  )

  console.log(`Reading iOS database from: ${dbPath}`)
  console.log(`Output directory: ${outputDir}`)

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true })

  // Define all schemas
  const schemas = [
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
  ]

  // Open Realm database
  const realm = new Realm({
    path: dbPath,
    schema: schemas,
    readOnly: true,
  })

  try {
    const schemaInfo: { schemas: SchemaInfo[] } = { schemas: [] }

    // Export each schema
    for (const SchemaClass of schemas) {
      const schemaName = SchemaClass.schema.name
      console.log(`Exporting schema: ${schemaName}`)

      // Get schema properties
      const properties = Object.entries(SchemaClass.schema.properties).map(
        ([name, prop]: [string, any]) => ({
          name,
          type: prop.type,
          optional: prop.optional || false,
          primaryKey: prop.primaryKey || false,
        })
      )

      // Get all objects of this type
      const objects = realm.objects(schemaName)
      const objectCount = objects.length

      const info: SchemaInfo = {
        name: schemaName,
        properties,
        objectCount,
      }

      schemaInfo.schemas.push(info)

      // Convert to plain objects and handle Buffers
      const plainObjects = Array.from(objects).map((obj) =>
        realmObjectToPlain(obj)
      )

      const outputFile = path.join(outputDir, `${schemaName}.json`)
      await fs.writeFile(outputFile, JSON.stringify(plainObjects, null, 2))

      console.log(`  Exported ${objectCount} objects to ${outputFile}`)
    }

    // Write schema file
    const schemaFile = path.join(outputDir, "schema.json")
    await fs.writeFile(schemaFile, JSON.stringify(schemaInfo, null, 2))
    console.log(`Schema written to: ${schemaFile}`)
  } finally {
    realm.close()
  }

  console.log("iOS database export completed!")
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportIOSDatabase().catch(console.error)
}

export { exportIOSDatabase }
