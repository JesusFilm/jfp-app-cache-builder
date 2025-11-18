import { z } from "zod"

import { type TableInfo, tableInfoSchema } from "../common/schema"

let tables: TableInfo[]

try {
  const androidSchema = await import("./data/schema.json")
  const validatedSchema = tableInfoSchema.element
    .extend({ platform: z.literal("android") })
    .array()
    .parse(androidSchema.default)
  tables = validatedSchema
} catch {
  // Soft fail - return empty schema if file can't be found or validation fails
  tables = []
}

export { tables }
