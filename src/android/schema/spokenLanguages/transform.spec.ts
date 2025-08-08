import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_SpokenLanguagesQuery as query } from "./query.js"
import { transformSpokenLanguages } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn(() => Promise.resolve(prisma)),
}))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformSpokenLanguages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform spoken languages and write to database", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            countryLanguages: [
              {
                language: { id: "529" },
                speakers: 250000000,
              },
              {
                language: { id: "21028" },
                speakers: 45000000,
              },
              {
                language: { id: "6930" },
                speakers: 1000000,
              },
            ],
          },
          {
            countryId: "CA",
            countryLanguages: [
              {
                language: { id: "529" },
                speakers: 20000000,
              },
              {
                language: { id: "21028" },
                speakers: 8000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSpokenLanguages({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith({
        query,
      })

      // Verify database createMany was called for all spoken languages
      expect(mockDb.spoken_languages.createMany).toHaveBeenCalledTimes(1)

      // Check createMany was called with all spoken languages
      expect(mockDb.spoken_languages.createMany).toHaveBeenCalledWith({
        data: [
          {
            countryId: "US",
            languageId: "529",
            speakerCount: 250000000,
          },
          {
            countryId: "US",
            languageId: "21028",
            speakerCount: 45000000,
          },
          {
            countryId: "US",
            languageId: "6930",
            speakerCount: 1000000,
          },
          {
            countryId: "CA",
            languageId: "529",
            speakerCount: 20000000,
          },
          {
            countryId: "CA",
            languageId: "21028",
            speakerCount: 8000000,
          },
        ],
      })

      // Verify the transformed data
      expect(result).toEqual([
        {
          countryId: "US",
          languageId: "529",
          speakerCount: 250000000,
        },
        {
          countryId: "US",
          languageId: "21028",
          speakerCount: 45000000,
        },
        {
          countryId: "US",
          languageId: "6930",
          speakerCount: 1000000,
        },
        {
          countryId: "CA",
          languageId: "529",
          speakerCount: 20000000,
        },
        {
          countryId: "CA",
          languageId: "21028",
          speakerCount: 8000000,
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
                speakers: 65000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSpokenLanguages({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(mockDb.spoken_languages.createMany).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          countryId: "FR",
          languageId: "529",
          speakerCount: 65000000,
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

      const result = await transformSpokenLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.spoken_languages.createMany).not.toHaveBeenCalled()
    })

    it("should handle countries with no spoken languages", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "XX",
            countryLanguages: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSpokenLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.spoken_languages.createMany).not.toHaveBeenCalled()
    })

    it("should handle missing speakers count", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "YY",
            countryLanguages: [
              {
                language: { id: "529" },
                speakers: null,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSpokenLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryId: "YY",
          languageId: "529",
          speakerCount: 0,
        },
      ])
    })

    it("should handle duplicates by keeping the record with highest speaker count", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            countryLanguages: [
              {
                language: { id: "529" },
                speakers: 250000000, // Higher speaker count
              },
              {
                language: { id: "529" }, // Duplicate languageId within same country
                speakers: 200000000, // Lower speaker count
              },
              {
                language: { id: "21028" },
                speakers: 45000000,
              },
              {
                language: { id: "21028" }, // Another duplicate within same country
                speakers: 40000000, // Lower speaker count
              },
            ],
          },
          {
            countryId: "CA",
            countryLanguages: [
              {
                language: { id: "529" },
                speakers: 20000000,
              },
              {
                language: { id: "6930" },
                speakers: 1000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformSpokenLanguages({
        languageId: "529",
        languageTag: "en",
      })

      // Should have 4 unique combinations: US-529, US-21028, CA-529, CA-6930
      expect(result).toHaveLength(4)

      // Should keep the highest speaker count for US-529 (250000000)
      const us529Record = result.find(
        (record) => record.countryId === "US" && record.languageId === "529"
      )
      expect(us529Record).toEqual({
        countryId: "US",
        languageId: "529",
        speakerCount: 250000000,
      })

      // Should keep the highest speaker count for US-21028 (45000000)
      const us21028Record = result.find(
        (record) => record.countryId === "US" && record.languageId === "21028"
      )
      expect(us21028Record).toEqual({
        countryId: "US",
        languageId: "21028",
        speakerCount: 45000000,
      })

      // Should keep CA-529 record
      const ca529Record = result.find(
        (record) => record.countryId === "CA" && record.languageId === "529"
      )
      expect(ca529Record).toEqual({
        countryId: "CA",
        languageId: "529",
        speakerCount: 20000000,
      })

      // Should keep CA-6930 record
      const ca6930Record = result.find(
        (record) => record.countryId === "CA" && record.languageId === "6930"
      )
      expect(ca6930Record).toEqual({
        countryId: "CA",
        languageId: "6930",
        speakerCount: 1000000,
      })

      // Verify database createMany was called only for the deduplicated records
      expect(mockDb.spoken_languages.createMany).toHaveBeenCalledTimes(1)
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformSpokenLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.spoken_languages.createMany).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            countryLanguages: [
              {
                language: { id: "529" },
                speakers: 250000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      ;(mockDb.spoken_languages.createMany as any).mockRejectedValue(
        new Error("Database write failed")
      )

      await expect(
        transformSpokenLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })
})
