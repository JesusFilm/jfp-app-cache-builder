import { z } from "zod"

import { tableInfoSchema } from "../common/schema"

const extendedTableInfoSchema = tableInfoSchema.element
  .extend({ platform: z.literal("android") })
  .array()

let tables: z.infer<typeof extendedTableInfoSchema>

try {
  const androidSchema = await import("./data/schema.json")
  const validatedSchema = extendedTableInfoSchema.parse(androidSchema.default)
  tables = validatedSchema
} catch {
  // Soft fail - return empty schema if file can't be found or validation fails
  tables = []
}

export { tables }
