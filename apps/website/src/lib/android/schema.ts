import { type TableInfo, tableInfoSchema } from "../common/schema"

let tables: TableInfo[]

try {
  const androidSchema = await import("./data/schema.json") // eslint-disable-line @typescript-eslint/ban-ts-comment // @ts-expect-error
  const validatedSchema = tableInfoSchema.parse(androidSchema.default)
  tables = validatedSchema
} catch {
  // Soft fail - return empty schema if file can't be found or validation fails
  tables = []
}

export { tables }
