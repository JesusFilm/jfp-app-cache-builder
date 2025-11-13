import { type TableInfo, tableInfoSchema } from "../common/schema"

let tables: TableInfo[]

try {
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore - schema.json is generated at build time
  const androidSchema = await import("./data/schema.json")
  /* eslint-enable @typescript-eslint/ban-ts-comment */
  const validatedSchema = tableInfoSchema.parse(androidSchema.default)
  tables = validatedSchema
} catch {
  // Soft fail - return empty schema if file can't be found or validation fails
  tables = []
}

export { tables }
