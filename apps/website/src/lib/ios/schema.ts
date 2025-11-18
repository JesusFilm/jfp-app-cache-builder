import { z } from "zod"

import { type TableInfo, tableInfoSchema } from "../common/schema"

let tables: TableInfo[]

try {
  const iosSchema = await import("./data/schema.json")
  const validatedSchema = tableInfoSchema.element
    .extend({ platform: z.literal("ios") })
    .array()
    .parse(iosSchema.default)
  tables = validatedSchema
} catch {
  // Soft fail - return empty schema if file can't be found or validation fails
  tables = []
}

export { tables }
