import { promises as fs } from "fs"
import path from "path"
import process from "process"

import Database from "better-sqlite3"

interface TableInfo {
  name: string
  count: number
  platform: "ios" | "android"
}

async function exportAndroidDatabase() {
  const dbPath = path.join(process.cwd(), "assets", "android", "cache.db")
  const outputDir = path.join(
    process.cwd(),
    "..",
    "website",
    "src",
    "lib",
    "android",
    "data"
  )

  console.log(`Reading Android database from: ${dbPath}`)
  console.log(`Output directory: ${outputDir}`)

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true })

  // Open database
  const db = new Database(dbPath, { readonly: true })

  try {
    // Get all table names
    const tables = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_metadata'
      ORDER BY name
    `
      )
      .all() as Array<{ name: string }>

    console.log(
      `Found ${tables.length} tables:`,
      tables.map((t) => t.name)
    )

    const tablesInfo: TableInfo[] = []

    // Export each table
    for (const table of tables) {
      const tableName = table.name
      console.log(`Exporting table: ${tableName}`)

      // Get row count
      const rowCount = db
        .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
        .get() as { count: number }

      const tableInfo: TableInfo = {
        name: tableName,
        count: rowCount.count,
        platform: "android",
      }

      tablesInfo.push(tableInfo)

      // Export table data
      const data = db.prepare(`SELECT * FROM ${tableName}`).all()

      const outputFile = path.join(outputDir, `${tableName}.json`)
      await fs.writeFile(outputFile, JSON.stringify(data, null, 2))

      console.log(`  Exported ${data.length} rows to ${outputFile}`)
    }

    // Write schema file
    const schemaFile = path.join(outputDir, "schema.json")
    await fs.writeFile(schemaFile, JSON.stringify(tablesInfo, null, 2))
    console.log(`Schema written to: ${schemaFile}`)
  } finally {
    db.close()
  }

  console.log("Android database export completed!")
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportAndroidDatabase().catch(console.error)
}

export { exportAndroidDatabase }
