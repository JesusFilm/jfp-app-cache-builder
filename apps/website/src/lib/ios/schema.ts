import { z } from "zod"

import { tableInfoSchema } from "../common/schema"

const extendedTableInfoSchema = tableInfoSchema.element
  .extend({ platform: z.literal("ios") })
  .array()

let tables: z.infer<typeof extendedTableInfoSchema>

try {
  const iosSchema = await import("./data/schema.json")
  const validatedSchema = extendedTableInfoSchema.parse(iosSchema.default)
  tables = validatedSchema
} catch {
  // Soft fail - return empty schema if file can't be found or validation fails
  tables = []
}

export { tables }
