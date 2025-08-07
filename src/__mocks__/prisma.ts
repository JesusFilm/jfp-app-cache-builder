import { mockDeep, DeepMockProxy } from "vitest-mock-extended"

import { PrismaClient } from "../__generated__/prisma/index.js"

const prisma = mockDeep<PrismaClient>()

export { prisma }
export type PrismaMock = DeepMockProxy<PrismaClient>
