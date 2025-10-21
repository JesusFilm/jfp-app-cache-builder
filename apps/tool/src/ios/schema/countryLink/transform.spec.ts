import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"
import { getDb } from "../../lib/db.js"

import { CountryLink } from "./realm.js"
import { transformCountryLinks } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js")

const mockClient = vi.mocked(client)
const mockGetDb = vi.mocked(getDb)

describe("transformCountryLinks", () => {
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
    it("should transform country links and write to database", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "US",
            countryLanguages: [
              {
                language: { id: "529" },
                speakerCount: 250000000,
              },
              {
                language: { id: "21028" },
                speakerCount: 41000000,
              },
            ],
          },
          {
            id: "CA",
            countryLanguages: [
              {
                language: { id: "529" },
                speakerCount: 20000000,
              },
              {
                language: { id: "21028" },
                speakerCount: 7000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountryLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called with correct parameters
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
          speakerCount: 250000000,
        },
        {
          countryLanguageId: "US__21028",
          languageId: 21028,
          speakerCount: 41000000,
        },
        {
          countryLanguageId: "CA__529",
          languageId: 529,
          speakerCount: 20000000,
        },
        {
          countryLanguageId: "CA__21028",
          languageId: 21028,
          speakerCount: 7000000,
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.create).toHaveBeenCalledWith(
        CountryLink,
        {
          countryLanguageId: "US__529",
          languageId: 529,
          speakerCount: 250000000,
        },
        Realm.UpdateMode.Modified
      )
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "MX",
            countryLanguages: [
              {
                language: { id: "21028" },
                speakerCount: 120000000,
              },
              {
                language: { id: "529" },
                speakerCount: 10000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountryLinks({
        languageId: "21028",
        languageTag: "es",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(mockDb.write).not.toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          countryLanguageId: "MX__21028",
          languageId: 21028,
          speakerCount: 120000000,
        },
        {
          countryLanguageId: "MX__529",
          languageId: 529,
          speakerCount: 10000000,
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

      const result = await transformCountryLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle countries with no languages", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "XX",
            countryLanguages: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountryLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle missing speaker count", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "YY",
            countryLanguages: [
              {
                language: { id: "529" },
                speakerCount: null,
              },
              {
                language: { id: "21028" },
                speakerCount: 5000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountryLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryLanguageId: "YY__529",
          languageId: 529,
          speakerCount: 0,
        },
        {
          countryLanguageId: "YY__21028",
          languageId: 21028,
          speakerCount: 5000000,
        },
      ])
    })

    it("should handle multiple countries with varying language counts", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "FR",
            countryLanguages: [
              {
                language: { id: "529" },
                speakerCount: 15000000,
              },
            ],
          },
          {
            id: "DE",
            countryLanguages: [
              {
                language: { id: "529" },
                speakerCount: 20000000,
              },
              {
                language: { id: "21028" },
                speakerCount: 5000000,
              },
              {
                language: { id: "6930" },
                speakerCount: 1000000,
              },
            ],
          },
          {
            id: "IT",
            countryLanguages: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountryLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryLanguageId: "FR__529",
          languageId: 529,
          speakerCount: 15000000,
        },
        {
          countryLanguageId: "DE__529",
          languageId: 529,
          speakerCount: 20000000,
        },
        {
          countryLanguageId: "DE__21028",
          languageId: 21028,
          speakerCount: 5000000,
        },
        {
          countryLanguageId: "DE__6930",
          languageId: 6930,
          speakerCount: 1000000,
        },
      ])
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformCountryLinks({
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
            id: "US",
            countryLanguages: [
              {
                language: { id: "529" },
                speakerCount: 250000000,
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
        transformCountryLinks({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly transform country link data structure", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "BR",
            countryLanguages: [
              {
                language: { id: "21028" },
                speakerCount: 200000000,
              },
              {
                language: { id: "529" },
                speakerCount: 15000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountryLinks({
        languageId: "21028",
        languageTag: "pt",
      })

      // Verify the transformation logic
      expect(result).toEqual([
        {
          countryLanguageId: "BR__21028",
          languageId: 21028,
          speakerCount: 200000000,
        },
        {
          countryLanguageId: "BR__529",
          languageId: 529,
          speakerCount: 15000000,
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.create).toHaveBeenCalledWith(
        CountryLink,
        {
          countryLanguageId: "BR__21028",
          languageId: 21028,
          speakerCount: 200000000,
        },
        Realm.UpdateMode.Modified
      )
    })

    it("should handle large speaker counts correctly", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "IN",
            countryLanguages: [
              {
                language: { id: "529" },
                speakerCount: 125000000,
              },
              {
                language: { id: "21028" },
                speakerCount: 10000000,
              },
              {
                language: { id: "6930" },
                speakerCount: 5000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountryLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryLanguageId: "IN__529",
          languageId: 529,
          speakerCount: 125000000,
        },
        {
          countryLanguageId: "IN__21028",
          languageId: 21028,
          speakerCount: 10000000,
        },
        {
          countryLanguageId: "IN__6930",
          languageId: 6930,
          speakerCount: 5000000,
        },
      ])

      // Verify all database objects are created
      expect(mockDb.create).toHaveBeenCalledTimes(3)
    })

    it("should handle zero speaker counts", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            id: "ZZ",
            countryLanguages: [
              {
                language: { id: "529" },
                speakerCount: 0,
              },
              {
                language: { id: "21028" },
                speakerCount: 1000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountryLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryLanguageId: "ZZ__529",
          languageId: 529,
          speakerCount: 0,
        },
        {
          countryLanguageId: "ZZ__21028",
          languageId: 21028,
          speakerCount: 1000,
        },
      ])
    })
  })
})
