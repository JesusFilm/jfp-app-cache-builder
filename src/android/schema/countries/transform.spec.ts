import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_CountriesQuery as query } from "./query.js"
import { transformCountries } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({
  db: prisma,
}))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformCountries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform countries and write to database", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            name: [{ value: "United States" }],
            continent: {
              continentName: [{ value: "North America" }],
            },
            languageHavingMediaCount: 1,
            population: 331002651,
            longitude: -97.0,
            latitude: 38.0,
            flagLossyWeb: "https://flagcdn.com/w320/us.webp",
            flagPng8: "https://flagcdn.com/w320/us.png",
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "21028",
        languageTag: "es",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith({
        query,
        variables: { languageId: "21028" },
      })

      // Verify database create was called
      expect(mockDb.countries.create).toHaveBeenCalledTimes(1)
      expect(mockDb.countries.create).toHaveBeenCalledWith({
        data: {
          countryId: "US",
          name: "United States",
          continentName: "North America",
          languageHavingMediaCount: 1,
          population: 331002651,
          longitude: -97,
          latitude: 38,
          flagLossyWeb: "https://flagcdn.com/w320/us.webp",
          flagPng8: "https://flagcdn.com/w320/us.png",
        },
      })

      // Verify the transformed data
      expect(result).toEqual([
        {
          countryId: "US",
          name: "United States",
          continentName: "North America",
          languageHavingMediaCount: 1,
          population: 331002651,
          longitude: -97.0,
          latitude: 38.0,
          flagLossyWeb: "https://flagcdn.com/w320/us.webp",
          flagPng8: "https://flagcdn.com/w320/us.png",
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "CA",
            name: [{ value: "Canada" }],
            continent: {
              continentName: [{ value: "North America" }],
            },
            languageHavingMediaCount: 2,
            population: 37742154,
            longitude: -95.0,
            latitude: 60.0,
            flagLossyWeb: "https://flagcdn.com/w320/ca.webp",
            flagPng8: "https://flagcdn.com/w320/ca.png",
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(mockDb.countries.create).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          countryId: "CA",
          name: "Canada",
          continentName: "North America",
          languageHavingMediaCount: 2,
          population: 37742154,
          longitude: -95.0,
          latitude: 60.0,
          flagLossyWeb: "https://flagcdn.com/w320/ca.webp",
          flagPng8: "https://flagcdn.com/w320/ca.png",
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

      const result = await transformCountries({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.countries.create).not.toHaveBeenCalled()
    })

    it("should handle missing optional fields", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "XX",
            name: [{ value: "Unknown Country" }],
            continent: {
              continentName: [],
            },
            languageHavingMediaCount: 0,
            population: null,
            longitude: null,
            latitude: null,
            flagLossyWeb: null,
            flagPng8: null,
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryId: "XX",
          name: "Unknown Country",
          continentName: "",
          languageHavingMediaCount: 0,
          population: 0,
          longitude: 0,
          latitude: 0,
          flagLossyWeb: null,
          flagPng8: null,
        },
      ])
    })

    it("should handle missing name data", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "YY",
            name: [],
            continent: {
              continentName: [{ value: "Unknown" }],
            },
            languageHavingMediaCount: 1,
            population: 1000000,
            longitude: 0.0,
            latitude: 0.0,
            flagLossyWeb: "https://flagcdn.com/w320/yy.webp",
            flagPng8: "https://flagcdn.com/w320/yy.png",
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryId: "YY",
          name: "",
          continentName: "Unknown",
          languageHavingMediaCount: 1,
          population: 1000000,
          longitude: 0.0,
          latitude: 0.0,
          flagLossyWeb: "https://flagcdn.com/w320/yy.webp",
          flagPng8: "https://flagcdn.com/w320/yy.png",
        },
      ])
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformCountries({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.countries.create).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            name: [{ value: "United States" }],
            continent: {
              continentName: [{ value: "North America" }],
            },
            languageHavingMediaCount: 1,
            population: 331002651,
            longitude: -97.0,
            latitude: 38.0,
            flagLossyWeb: "https://flagcdn.com/w320/us.webp",
            flagPng8: "https://flagcdn.com/w320/us.png",
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      ;(mockDb.countries.create as any).mockRejectedValue(
        new Error("Database write failed")
      )

      await expect(
        transformCountries({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly use languageId and languageTag parameters", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "FR",
            name: [{ value: "France" }],
            continent: {
              continentName: [{ value: "Europe" }],
            },
            languageHavingMediaCount: 1,
            population: 65273511,
            longitude: 2.0,
            latitude: 46.0,
            flagLossyWeb: "https://flagcdn.com/w320/fr.webp",
            flagPng8: "https://flagcdn.com/w320/fr.png",
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "6930",
        languageTag: "he",
      })

      // Verify the language parameters are used correctly
      expect(result).toEqual([
        {
          countryId: "FR",
          name: "France",
          continentName: "Europe",
          languageHavingMediaCount: 1,
          population: 65273511,
          longitude: 2.0,
          latitude: 46.0,
          flagLossyWeb: "https://flagcdn.com/w320/fr.webp",
          flagPng8: "https://flagcdn.com/w320/fr.png",
        },
      ])
    })

    it("should correctly transform country data structure", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "MX",
            name: [{ value: "México" }],
            continent: {
              continentName: [{ value: "América del Norte" }],
            },
            languageHavingMediaCount: 2,
            population: 128932753,
            longitude: -102.0,
            latitude: 23.0,
            flagLossyWeb: "https://flagcdn.com/w320/mx.webp",
            flagPng8: "https://flagcdn.com/w320/mx.png",
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "21028",
        languageTag: "es",
      })

      // Verify the transformation logic
      expect(result).toEqual([
        {
          countryId: "MX",
          name: "México",
          continentName: "América del Norte",
          languageHavingMediaCount: 2,
          population: 128932753,
          longitude: -102.0,
          latitude: 23.0,
          flagLossyWeb: "https://flagcdn.com/w320/mx.webp",
          flagPng8: "https://flagcdn.com/w320/mx.png",
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.countries.create).toHaveBeenCalledWith({
        data: {
          countryId: "MX",
          name: "México",
          continentName: "América del Norte",
          languageHavingMediaCount: 2,
          population: 128932753,
          longitude: -102.0,
          latitude: 23.0,
          flagLossyWeb: "https://flagcdn.com/w320/mx.webp",
          flagPng8: "https://flagcdn.com/w320/mx.png",
        },
      })
    })

    it("should handle multiple countries with different configurations", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "FR",
            name: [{ value: "France" }],
            continent: {
              continentName: [{ value: "Europe" }],
            },
            languageHavingMediaCount: 1,
            population: 65273511,
            longitude: 2.0,
            latitude: 46.0,
            flagLossyWeb: "https://flagcdn.com/w320/fr.webp",
            flagPng8: "https://flagcdn.com/w320/fr.png",
          },
          {
            countryId: "DE",
            name: [{ value: "Germany" }],
            continent: {
              continentName: [{ value: "Europe" }],
            },
            languageHavingMediaCount: 1,
            population: 83783942,
            longitude: 10.0,
            latitude: 51.0,
            flagLossyWeb: "https://flagcdn.com/w320/de.webp",
            flagPng8: "https://flagcdn.com/w320/de.png",
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryId: "FR",
          name: "France",
          continentName: "Europe",
          languageHavingMediaCount: 1,
          population: 65273511,
          longitude: 2.0,
          latitude: 46.0,
          flagLossyWeb: "https://flagcdn.com/w320/fr.webp",
          flagPng8: "https://flagcdn.com/w320/fr.png",
        },
        {
          countryId: "DE",
          name: "Germany",
          continentName: "Europe",
          languageHavingMediaCount: 1,
          population: 83783942,
          longitude: 10.0,
          latitude: 51.0,
          flagLossyWeb: "https://flagcdn.com/w320/de.webp",
          flagPng8: "https://flagcdn.com/w320/de.png",
        },
      ])

      // Verify both countries were upserted
      expect(mockDb.countries.create).toHaveBeenCalledTimes(2)
    })
  })
})
