import { describe, expect, it, vi, beforeEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_CountryTranslationsQuery as query } from "./query.js"
import { transformCountryTranslations } from "./transform.js"

import type { TransformOptions } from "../../../types/transform.js"

vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn(() => Promise.resolve(prisma)),
}))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformCountryTranslations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  describe("successful transformation", () => {
    it("should transform country translations and write to database", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            name: [
              {
                value: "United States",
                language: {
                  id: "529",
                  bcp47: "en",
                },
              },
              {
                value: "Estados Unidos",
                language: {
                  id: "639",
                  bcp47: "es",
                },
              },
            ],
          },
          {
            countryId: "CA",
            name: [
              {
                value: "Canada",
                language: {
                  id: "529",
                  bcp47: "en",
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

      const result = await transformCountryTranslations(options)

      expect(mockClient.query).toHaveBeenCalledWith({
        query,
      })

      expect(mockDb.country_translations.create).toHaveBeenCalledTimes(3)

      // Check first country translation (US - English)
      expect(mockDb.country_translations.create).toHaveBeenCalledWith({
        data: {
          countryId: "US",
          name: "United States",
          languageTag: "en",
        },
      })

      // Check second country translation (US - Spanish)
      expect(mockDb.country_translations.create).toHaveBeenCalledWith({
        data: {
          countryId: "US",
          name: "Estados Unidos",
          languageTag: "es",
        },
      })

      // Check third country translation (CA - English)
      expect(mockDb.country_translations.create).toHaveBeenCalledWith({
        data: {
          countryId: "CA",
          name: "Canada",
          languageTag: "en",
        },
      })

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        countryId: "US",
        name: "United States",
        languageTag: "en",
      })
      expect(result[1]).toEqual({
        countryId: "US",
        name: "Estados Unidos",
        languageTag: "es",
      })
      expect(result[2]).toEqual({
        countryId: "CA",
        name: "Canada",
        languageTag: "en",
      })
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            name: [
              {
                value: "United States",
                language: {
                  id: "529",
                  bcp47: "en",
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

      const result = await transformCountryTranslations(options)

      expect(mockClient.query).toHaveBeenCalledWith({
        query,
      })

      expect(mockDb.country_translations.create).not.toHaveBeenCalled()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        countryId: "US",
        name: "United States",
        languageTag: "en",
      })
    })
  })

  describe("edge cases", () => {
    it("should handle empty countries array", async () => {
      const mockApiResponse = createMockResponse({
        countries: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const options: TransformOptions = {
        languageId: "529",
        languageTag: "en",
      }

      const result = await transformCountryTranslations(options)

      expect(mockDb.country_translations.create).not.toHaveBeenCalled()
      expect(result).toHaveLength(0)
    })

    it("should handle countries with no name translations", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            name: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const options: TransformOptions = {
        languageId: "529",
        languageTag: "en",
      }

      const result = await transformCountryTranslations(options)

      expect(mockDb.country_translations.create).not.toHaveBeenCalled()
      expect(result).toHaveLength(0)
    })

    it("should filter out translations with null bcp47", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            name: [
              {
                value: "United States",
                language: {
                  id: "529",
                  bcp47: "en",
                },
              },
              {
                value: "Estados Unidos",
                language: {
                  id: "639",
                  bcp47: null,
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

      const result = await transformCountryTranslations(options)

      expect(mockDb.country_translations.create).toHaveBeenCalledTimes(1)
      expect(mockDb.country_translations.create).toHaveBeenCalledWith({
        data: {
          countryId: "US",
          name: "United States",
          languageTag: "en",
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        countryId: "US",
        name: "United States",
        languageTag: "en",
      })
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      mockClient.query.mockRejectedValue(new Error("GraphQL error"))

      const options: TransformOptions = {
        languageId: "529",
        languageTag: "en",
      }

      await expect(transformCountryTranslations(options)).rejects.toThrow(
        "GraphQL error"
      )

      expect(mockDb.country_translations.create).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            name: [
              {
                value: "United States",
                language: {
                  id: "529",
                  bcp47: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      ;(mockDb.country_translations.create as any).mockRejectedValue(
        new Error("Database error")
      )

      const options: TransformOptions = {
        languageId: "529",
        languageTag: "en",
      }

      await expect(transformCountryTranslations(options)).rejects.toThrow(
        "Database error"
      )
    })
  })

  describe("data validation", () => {
    it("should correctly transform country translation data structure", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "FR",
            name: [
              {
                value: "France",
                language: {
                  id: "529",
                  bcp47: "en",
                },
              },
              {
                value: "Francia",
                language: {
                  id: "639",
                  bcp47: "es",
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

      const result = await transformCountryTranslations(options)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        countryId: "FR",
        name: "France",
        languageTag: "en",
      })
      expect(result[1]).toEqual({
        countryId: "FR",
        name: "Francia",
        languageTag: "es",
      })
    })

    it("should handle multiple countries with different translation counts", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            name: [
              {
                value: "United States",
                language: {
                  id: "529",
                  bcp47: "en",
                },
              },
              {
                value: "Estados Unidos",
                language: {
                  id: "639",
                  bcp47: "es",
                },
              },
              {
                value: "États-Unis",
                language: {
                  id: "fra",
                  bcp47: "fr",
                },
              },
            ],
          },
          {
            countryId: "CA",
            name: [
              {
                value: "Canada",
                language: {
                  id: "529",
                  bcp47: "en",
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

      const result = await transformCountryTranslations(options)

      expect(result).toHaveLength(4)
      expect(mockDb.country_translations.create).toHaveBeenCalledTimes(4)
    })
  })
})
