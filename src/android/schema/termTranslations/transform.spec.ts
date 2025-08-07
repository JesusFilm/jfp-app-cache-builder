import { describe, expect, it, vi, beforeEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_TermTranslationsQuery as query } from "./query.js"
import { transformTermTranslations } from "./transform.js"

import type { TransformOptions } from "../../../types/transform.js"

vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({ db: prisma }))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformTermTranslations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  describe("successful transformation", () => {
    it("should transform term translations and write to database", async () => {
      const mockApiResponse = createMockResponse({
        taxonomies: [
          {
            label: "genre",
            term: [
              {
                value: "Action",
                language: {
                  languageTag: "en",
                },
              },
              {
                value: "Acción",
                language: {
                  languageTag: "es",
                },
              },
            ],
          },
          {
            label: "category",
            term: [
              {
                value: "Movie",
                language: {
                  languageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const options: TransformOptions = {
        languageId: "529",
        languageTag: "en",
      }

      const result = await transformTermTranslations(options)

      expect(mockClient.query).toHaveBeenCalledWith({
        query,
      })

      expect(mockDb.term_translations.create).toHaveBeenCalledTimes(3)

      // Check first term translation (genre - English)
      expect(mockDb.term_translations.create).toHaveBeenCalledWith({
        data: {
          languageTag: "en",
          label: "genre",
          term: "Action",
        },
      })

      // Check second term translation (genre - Spanish)
      expect(mockDb.term_translations.create).toHaveBeenCalledWith({
        data: {
          languageTag: "es",
          label: "genre",
          term: "Acción",
        },
      })

      // Check third term translation (category - English)
      expect(mockDb.term_translations.create).toHaveBeenCalledWith({
        data: {
          languageTag: "en",
          label: "category",
          term: "Movie",
        },
      })

      expect(result).toEqual([
        {
          languageTag: "en",
          label: "genre",
          term: "Action",
        },
        {
          languageTag: "es",
          label: "genre",
          term: "Acción",
        },
        {
          languageTag: "en",
          label: "category",
          term: "Movie",
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        taxonomies: [
          {
            label: "genre",
            term: [
              {
                value: "Action",
                language: {
                  languageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const options: TransformOptions = {
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      }

      const result = await transformTermTranslations(options)

      expect(mockClient.query).toHaveBeenCalledWith({
        query,
      })

      expect(mockDb.term_translations.create).not.toHaveBeenCalled()

      expect(result).toEqual([
        {
          languageTag: "en",
          label: "genre",
          term: "Action",
        },
      ])
    })
  })

  describe("edge cases", () => {
    it("should handle empty taxonomies array", async () => {
      const mockApiResponse = createMockResponse({
        taxonomies: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformTermTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.term_translations.create).not.toHaveBeenCalled()
    })

    it("should handle taxonomies with no term translations", async () => {
      const mockApiResponse = createMockResponse({
        taxonomies: [
          {
            label: "genre",
            term: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformTermTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.term_translations.create).not.toHaveBeenCalled()
    })

    it("should handle term translations with missing languageTag", async () => {
      const mockApiResponse = createMockResponse({
        taxonomies: [
          {
            label: "genre",
            term: [
              {
                value: "Action",
                language: {
                  languageTag: null,
                },
              },
              {
                value: "Acción",
                language: {
                  languageTag: "es",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformTermTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageTag: "es",
          label: "genre",
          term: "Acción",
        },
      ])

      expect(mockDb.term_translations.create).toHaveBeenCalledTimes(1)
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformTermTranslations({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.term_translations.create).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        taxonomies: [
          {
            label: "genre",
            term: [
              {
                value: "Action",
                language: {
                  languageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      mockDb.term_translations.create.mockImplementation(() => {
        throw new Error("Database write failed")
      })

      await expect(
        transformTermTranslations({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly transform taxonomy data structure", async () => {
      const mockApiResponse = createMockResponse({
        taxonomies: [
          {
            label: "contentType",
            term: [
              {
                value: "Video",
                language: {
                  languageTag: "en",
                },
              },
              {
                value: "Audio",
                language: {
                  languageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformTermTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageTag: "en",
          label: "contentType",
          term: "Video",
        },
        {
          languageTag: "en",
          label: "contentType",
          term: "Audio",
        },
      ])
    })

    it("should handle multiple taxonomies with overlapping terms", async () => {
      const mockApiResponse = createMockResponse({
        taxonomies: [
          {
            label: "genre",
            term: [
              {
                value: "Action",
                language: {
                  languageTag: "en",
                },
              },
            ],
          },
          {
            label: "category",
            term: [
              {
                value: "Action",
                language: {
                  languageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformTermTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageTag: "en",
          label: "genre",
          term: "Action",
        },
        {
          languageTag: "en",
          label: "category",
          term: "Action",
        },
      ])

      expect(mockDb.term_translations.create).toHaveBeenCalledTimes(2)
    })
  })
})
