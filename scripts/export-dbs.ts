import { exportAndroidDatabase } from "./export-android-db.js"
import { exportIOSDatabase } from "./export-ios-db.js"

async function exportAllDatabases() {
  console.log("Starting database export process...")

  try {
    await exportAndroidDatabase()
    await exportIOSDatabase()
    console.log("All database exports completed successfully!")
  } catch (error) {
    console.error("Database export failed:", error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await exportAllDatabases()
  process.exit(0)
}

export { exportAllDatabases }
