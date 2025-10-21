import { z } from "zod"

export const tableInfoSchema = z.array(
  z.object({
    name: z.string(),
    count: z.number(),
    platform: z.literal("ios"),
  })
)
export type TableInfo = z.infer<typeof tableInfoSchema>[number]

export const tableDataSchema = z.array(z.record(z.string(), z.unknown()))

export type TableData = z.infer<typeof tableDataSchema>[number]
