import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_SuggestedLanguagesQuery as query } from "./query.js"
import { transformSuggestedLanguages } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn(() => Promise.resolve(prisma)),
}))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformSuggestedLanguages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform suggested languages and write to database", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: true,
                languageRank: 1,
              },
              {
                language: { id: "21028" },
                suggested: false,
                languageRank: 2,
              },
              {
                language: { id: "6930" },
                suggested: true,
                languageRank: 3,
              },
            ],
          },
          {
            countryId: "CA",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: true,
                languageRank: 1,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSuggestedLanguages({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith({
        query,
      })

      // Verify database createMany was called for suggested languages only
      expect(mockDb.suggested_languages.createMany).toHaveBeenCalledTimes(1)

      // Check that createMany was called with all suggested languages
      expect(mockDb.suggested_languages.createMany).toHaveBeenCalledWith({
        data: [
          {
            countryId: "US",
            languageId: "529",
            languageRank: 1,
          },
          {
            countryId: "US",
            languageId: "6930",
            languageRank: 3,
          },
          {
            countryId: "CA",
            languageId: "529",
            languageRank: 1,
          },
        ],
      })

      // Verify the transformed data
      expect(result).toEqual([
        {
          countryId: "US",
          languageId: "529",
          languageRank: 1,
        },
        {
          countryId: "US",
          languageId: "6930",
          languageRank: 3,
        },
        {
          countryId: "CA",
          languageId: "529",
          languageRank: 1,
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "FR",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: true,
                languageRank: 1,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSuggestedLanguages({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(mockDb.suggested_languages.createMany).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          countryId: "FR",
          languageId: "529",
          languageRank: 1,
        },
      ])
    })
  })

  describe("edge cases", () => {
    it("should handle empty countries array", async () => {
      const mockApiResponse = createMockResponse({
        countries: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSuggestedLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.suggested_languages.createMany).not.toHaveBeenCalled()
    })

    it("should handle countries with no suggested languages", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "XX",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: false,
                languageRank: 1,
              },
              {
                language: { id: "21028" },
                suggested: false,
                languageRank: 2,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSuggestedLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.suggested_languages.createMany).not.toHaveBeenCalled()
    })

    it("should handle missing languageRank", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "YY",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: true,
                languageRank: null,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSuggestedLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryId: "YY",
          languageId: "529",
          languageRank: 0,
        },
      ])
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformSuggestedLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.suggested_languages.createMany).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: true,
                languageRank: 1,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      ;(mockDb.suggested_languages.createMany as any).mockRejectedValue(
        new Error("Database write failed")
      )

      await expect(
        transformSuggestedLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })
})
