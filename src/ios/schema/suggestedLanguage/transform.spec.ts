import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"
import { getDb } from "../../lib/db.js"

import { SuggestedLanguage } from "./realm.js"
import { transformSuggestedLanguages } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js")

const mockClient = vi.mocked(client)
const mockGetDb = vi.mocked(getDb)

describe("transformSuggestedLanguages", () => {
  let mockDb: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a mock database object
    mockDb = {
      write: vi.fn().mockImplementation((callback) => {
        callback()
      }),
      create: vi.fn(),
    }

    // Mock getDb to return the mock database
    mockGetDb.mockResolvedValue(mockDb)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform suggested languages and write to database", async () => {
      // Mock API response with countries that have suggested languages
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "US",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: true,
                languageRank: 1,
              },
              {
                language: { id: "21028" },
                suggested: true,
                languageRank: 2,
              },
              {
                language: { id: "6930" },
                suggested: false,
                languageRank: 3,
              },
            ],
          },
          {
            id: "MX",
            countryLanguages: [
              {
                language: { id: "21028" },
                suggested: true,
                languageRank: 1,
              },
              {
                language: { id: "529" },
                suggested: true,
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

      // Verify API was called
      expect(mockClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
      })

      // Verify getDb was called
      expect(mockGetDb).toHaveBeenCalled()

      // Verify database write was called
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).toHaveBeenCalledTimes(4)

      // Verify the transformed data
      expect(result).toEqual([
        {
          countryLanguageId: "US__529",
          languageId: 529,
          languageRank: 1,
        },
        {
          countryLanguageId: "US__21028",
          languageId: 21028,
          languageRank: 2,
        },
        {
          countryLanguageId: "MX__21028",
          languageId: 21028,
          languageRank: 1,
        },
        {
          countryLanguageId: "MX__529",
          languageId: 529,
          languageRank: 2,
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.create).toHaveBeenCalledWith(
        SuggestedLanguage,
        {
          countryLanguageId: "US__529",
          languageId: 529,
          languageRank: 1,
        },
        Realm.UpdateMode.Modified
      )
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "FR",
            countryLanguages: [
              {
                language: { id: "22658" },
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
      expect(mockDb.write).not.toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          countryLanguageId: "FR__22658",
          languageId: 22658,
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
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle countries with no suggested languages", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "JP",
            countryLanguages: [
              {
                language: { id: "6464" },
                suggested: false,
                languageRank: 1,
              },
              {
                language: { id: "529" },
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
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle countries with empty countryLanguages", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "XX",
            countryLanguages: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSuggestedLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle missing languageRank (defaults to 0)", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "CA",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: true,
                languageRank: null,
              },
              {
                language: { id: "22658" },
                suggested: true,
                languageRank: undefined,
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
          countryLanguageId: "CA__529",
          languageId: 529,
          languageRank: 0,
        },
        {
          countryLanguageId: "CA__22658",
          languageId: 22658,
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

      expect(mockDb.write).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "DE",
            countryLanguages: [
              {
                language: { id: "20601" },
                suggested: true,
                languageRank: 1,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      mockDb.write.mockImplementation(() => {
        throw new Error("Database write failed")
      })

      await expect(
        transformSuggestedLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly parse languageId as integer", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "BR",
            countryLanguages: [
              {
                language: { id: "21696" },
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

      expect(result).toEqual([
        {
          countryLanguageId: "BR__21696",
          languageId: 21696, // Should be parsed as integer
          languageRank: 1,
        },
      ])

      expect(typeof result[0]!.languageId).toBe("number")
    })

    it("should create correct countryLanguageId format", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "AU",
            countryLanguages: [
              {
                language: { id: "529" },
                suggested: true,
                languageRank: 1,
              },
            ],
          },
          {
            id: "NZ",
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

      expect(result).toEqual([
        {
          countryLanguageId: "AU__529",
          languageId: 529,
          languageRank: 1,
        },
        {
          countryLanguageId: "NZ__529",
          languageId: 529,
          languageRank: 1,
        },
      ])

      // Verify unique countryLanguageId for same language in different countries
      expect(result[0]!.countryLanguageId).not.toBe(
        result[1]!.countryLanguageId
      )
    })

    it("should handle multiple suggested languages with different ranks", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "CH",
            countryLanguages: [
              {
                language: { id: "20601" }, // German
                suggested: true,
                languageRank: 1,
              },
              {
                language: { id: "22658" }, // French
                suggested: true,
                languageRank: 2,
              },
              {
                language: { id: "24689" }, // Italian
                suggested: true,
                languageRank: 3,
              },
              {
                language: { id: "529" }, // English
                suggested: true,
                languageRank: 4,
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
          countryLanguageId: "CH__20601",
          languageId: 20601,
          languageRank: 1,
        },
        {
          countryLanguageId: "CH__22658",
          languageId: 22658,
          languageRank: 2,
        },
        {
          countryLanguageId: "CH__24689",
          languageId: 24689,
          languageRank: 3,
        },
        {
          countryLanguageId: "CH__529",
          languageId: 529,
          languageRank: 4,
        },
      ])
    })

    it("should filter out non-suggested languages correctly", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "IN",
            countryLanguages: [
              {
                language: { id: "6930" }, // Hindi
                suggested: true,
                languageRank: 1,
              },
              {
                language: { id: "529" }, // English
                suggested: true,
                languageRank: 2,
              },
              {
                language: { id: "21028" }, // Spanish
                suggested: false,
                languageRank: 3,
              },
              {
                language: { id: "22658" }, // French
                suggested: false,
                languageRank: 4,
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

      // Should only include the suggested languages (Hindi and English)
      expect(result).toEqual([
        {
          countryLanguageId: "IN__6930",
          languageId: 6930,
          languageRank: 1,
        },
        {
          countryLanguageId: "IN__529",
          languageId: 529,
          languageRank: 2,
        },
      ])

      // Verify Spanish and French are not included
      expect(result.find((lang) => lang.languageId === 21028)).toBeUndefined()
      expect(result.find((lang) => lang.languageId === 22658)).toBeUndefined()
    })
  })

  describe("without logger", () => {
    it("should work without logger parameter", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "GB",
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

      expect(result).toEqual([
        {
          countryLanguageId: "GB__529",
          languageId: 529,
          languageRank: 1,
        },
      ])

      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).toHaveBeenCalledTimes(1)
    })
  })
})
