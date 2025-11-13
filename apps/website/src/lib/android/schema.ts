import { type TableInfo, tableInfoSchema } from "../common/schema"

let tables: TableInfo[]

try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  const androidSchema = await import("./data/schema.json")
  const validatedSchema = tableInfoSchema.parse(androidSchema.default)
  tables = validatedSchema
} catch {
  // Soft fail - return empty schema if file can't be found or validation fails
  tables = []
}

export { tables }
