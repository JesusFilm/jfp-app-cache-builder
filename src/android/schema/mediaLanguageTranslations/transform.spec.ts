import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_MediaLanguageTranslationsQuery as query } from "./query.js"
import { transformMediaLanguageTranslations } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn(() => Promise.resolve(prisma)),
}))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformMediaLanguageTranslations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform languages and their translations into media language translations", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "lang1",
            name: [
              {
                value: "English",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Inglés",
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
          },
          {
            id: "lang2",
            name: [
              {
                value: "Spanish",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Español",
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageTranslations({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith({
        query,
        variables: {},
      })

      // Verify database createMany was called for all translations
      expect(
        mockDb.media_language_translations.createMany
      ).toHaveBeenCalledTimes(1)

      // Verify createMany was called with all language translations
      expect(
        mockDb.media_language_translations.createMany
      ).toHaveBeenCalledWith({
        data: [
          {
            languageId: "lang1",
            name: "English",
            metadataLanguageTag: "en",
          },
          {
            languageId: "lang1",
            name: "Inglés",
            metadataLanguageTag: "es",
          },
          {
            languageId: "lang2",
            name: "Spanish",
            metadataLanguageTag: "en",
          },
          {
            languageId: "lang2",
            name: "Español",
            metadataLanguageTag: "es",
          },
        ],
      })

      // Verify the transformed data
      expect(result).toEqual([
        {
          languageId: "lang1",
          name: "English",
          metadataLanguageTag: "en",
        },
        {
          languageId: "lang1",
          name: "Inglés",
          metadataLanguageTag: "es",
        },
        {
          languageId: "lang2",
          name: "Spanish",
          metadataLanguageTag: "en",
        },
        {
          languageId: "lang2",
          name: "Español",
          metadataLanguageTag: "es",
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "lang1",
            name: [
              {
                value: "English",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageTranslations({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(
        mockDb.media_language_translations.createMany
      ).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          languageId: "lang1",
          name: "English",
          metadataLanguageTag: "en",
        },
      ])
    })
  })

  describe("edge cases", () => {
    it("should handle empty languages array", async () => {
      const mockApiResponse = createMockResponse({
        languages: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(
        mockDb.media_language_translations.createMany
      ).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })

    it("should handle languages with no name translations", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "lang1",
            name: [],
          },
          {
            id: "lang2",
            name: [
              {
                value: "Spanish",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "lang2",
          name: "Spanish",
          metadataLanguageTag: "en",
        },
      ])

      // Only the language with translations should be created
      expect(
        mockDb.media_language_translations.createMany
      ).toHaveBeenCalledTimes(1)
    })

    it("should handle languages with missing metadataLanguageTag", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "lang1",
            name: [
              {
                value: "English",
                language: {
                  metadataLanguageTag: null,
                },
              },
              {
                value: "Spanish",
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "lang1",
          name: "Spanish",
          metadataLanguageTag: "es",
        },
      ])

      // Only the translation with metadataLanguageTag should be created
      expect(
        mockDb.media_language_translations.createMany
      ).toHaveBeenCalledTimes(1)
    })

    it("should handle single language with multiple translations", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "lang1",
            name: [
              {
                value: "English",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Inglés",
                language: {
                  metadataLanguageTag: "es",
                },
              },
              {
                value: "Anglais",
                language: {
                  metadataLanguageTag: "fr",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "lang1",
          name: "English",
          metadataLanguageTag: "en",
        },
        {
          languageId: "lang1",
          name: "Inglés",
          metadataLanguageTag: "es",
        },
        {
          languageId: "lang1",
          name: "Anglais",
          metadataLanguageTag: "fr",
        },
      ])

      expect(
        mockDb.media_language_translations.createMany
      ).toHaveBeenCalledTimes(1)
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformMediaLanguageTranslations({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(
        mockDb.media_language_translations.createMany
      ).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "lang1",
            name: [
              {
                value: "English",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      ;(mockDb.media_language_translations.createMany as any).mockRejectedValue(
        new Error("Database write failed")
      )

      await expect(
        transformMediaLanguageTranslations({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly transform language data structure", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "lang1",
            name: [
              {
                value: "English",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "lang1",
          name: "English",
          metadataLanguageTag: "en",
        },
      ])

      // Verify database objects are created with correct structure
      expect(
        mockDb.media_language_translations.createMany
      ).toHaveBeenCalledWith({
        data: [
          {
            languageId: "lang1",
            name: "English",
            metadataLanguageTag: "en",
          },
        ],
      })
    })

    it("should handle multiple languages with overlapping metadata language tags", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "lang1",
            name: [
              {
                value: "English",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Spanish",
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
          },
          {
            id: "lang2",
            name: [
              {
                value: "French",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Français",
                language: {
                  metadataLanguageTag: "fr",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageTranslations({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "lang1",
          name: "English",
          metadataLanguageTag: "en",
        },
        {
          languageId: "lang1",
          name: "Spanish",
          metadataLanguageTag: "es",
        },
        {
          languageId: "lang2",
          name: "French",
          metadataLanguageTag: "en",
        },
        {
          languageId: "lang2",
          name: "Français",
          metadataLanguageTag: "fr",
        },
      ])

      // Verify all 4 translations were created
      expect(
        mockDb.media_language_translations.createMany
      ).toHaveBeenCalledTimes(1)
    })
  })
})
