import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"
import { getDb } from "../../lib/db.js"
import { CountryLink } from "../countryLink/realm.js"
import { SuggestedLanguage } from "../suggestedLanguage/realm.js"

import { Country } from "./realm.js"
import { transformCountries } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js")

const mockClient = vi.mocked(client)
const mockGetDb = vi.mocked(getDb)

describe("transformCountries", () => {
  let mockDb: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a mock database object
    mockDb = {
      write: vi.fn().mockImplementation((callback) => {
        callback()
      }),
      create: vi.fn(),
      objectForPrimaryKey: vi.fn(),
    }

    // Mock getDb to return the mock database
    mockGetDb.mockResolvedValue(mockDb)
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
            flagUrlPng: "https://flagcdn.com/w320/us.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/us.webp",
            latitude: 38.0,
            longitude: -97.0,
            countryPopulation: 331002651,
            languageCount: 2,
            languageCountHavingMedia: 1,
            continent: {
              englishContinentName: [{ value: "North America" }],
              continentName: [{ value: "North America" }],
            },
            englishName: [{ value: "United States" }],
            name: [{ value: "United States" }],
            countryLanguages: [
              {
                suggested: true,
                language: { id: "529" },
              },
              {
                suggested: false,
                language: { id: "21028" },
              },
            ],
          },
        ],
      })

      // Mock CountryLink and SuggestedLanguage lookups
      const mockCountryLink = {
        id: "US__529",
        countryId: "US",
        languageId: "529",
      } as any
      const mockSuggestedLanguage = {
        id: "US__529",
        countryId: "US",
        languageId: "529",
      } as any

      mockDb.objectForPrimaryKey.mockImplementation((type: any, key: any) => {
        if (typeof key !== "string") return null

        if (type === CountryLink) {
          if (key === "US__529") return mockCountryLink
          if (key === "US__21028") return mockCountryLink
          return null
        }
        if (type === SuggestedLanguage) {
          if (key === "US__529") return mockSuggestedLanguage
          return null
        }
        return null
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "21028",
        languageTag: "es",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { languageId: "21028" },
      })

      // Verify database write was called
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).toHaveBeenCalledTimes(1)

      // Verify the transformed data
      expect(result).toEqual([
        {
          countryId: "US",
          flagUrlPng: "https://flagcdn.com/w320/us.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/us.webp",
          latitude: 38.0,
          longitude: -97.0,
          countryPopulation: 331002651,
          languageCount: 2,
          languageCountHavingMedia: 1,
          metadataLanguageTag: "es",
          currentDescriptorLanguageId: "21028",
          englishContinentName: "North America",
          continentName: "North America",
          englishName: "United States",
          name: "United States",
          languageSpeakerCounts: [mockCountryLink, mockCountryLink],
          suggestedLanguages: [mockSuggestedLanguage],
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "CA",
            flagUrlPng: "https://flagcdn.com/w320/ca.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/ca.webp",
            latitude: 60.0,
            longitude: -95.0,
            countryPopulation: 37742154,
            languageCount: 2,
            languageCountHavingMedia: 2,
            continent: {
              englishContinentName: [{ value: "North America" }],
              continentName: [{ value: "North America" }],
            },
            englishName: [{ value: "Canada" }],
            name: [{ value: "Canada" }],
            countryLanguages: [
              {
                suggested: true,
                language: { id: "529" },
              },
            ],
          },
        ],
      })

      const mockSuggestedLanguage = {
        id: "CA__529",
        countryId: "CA",
        languageId: "529",
      } as any

      mockDb.objectForPrimaryKey.mockImplementation((type: any, key: any) => {
        if (typeof key !== "string") return null

        if (type === SuggestedLanguage && key === "CA__529") {
          return mockSuggestedLanguage
        }
        return null
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
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
          countryId: "CA",
          flagUrlPng: "https://flagcdn.com/w320/ca.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/ca.webp",
          latitude: 60.0,
          longitude: -95.0,
          countryPopulation: 37742154,
          languageCount: 2,
          languageCountHavingMedia: 2,
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishContinentName: "North America",
          continentName: "North America",
          englishName: "Canada",
          name: "Canada",
          languageSpeakerCounts: [],
          suggestedLanguages: [mockSuggestedLanguage],
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
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle missing optional fields", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "XX",
            flagUrlPng: null,
            flagUrlWebPLossy50: null,
            latitude: null,
            longitude: null,
            countryPopulation: null,
            languageCount: 1,
            languageCountHavingMedia: 0,
            continent: {
              englishContinentName: [],
              continentName: [],
            },
            englishName: [],
            name: [
              {
                value: "Unknown Country",
                language: { id: "529", bcp47: "en" },
              },
            ],
            countryLanguages: [],
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
          flagUrlPng: "",
          flagUrlWebPLossy50: "",
          latitude: undefined,
          longitude: undefined,
          countryPopulation: undefined,
          languageCount: 1,
          languageCountHavingMedia: 0,
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishContinentName: "",
          continentName: "",
          englishName: "",
          name: "Unknown Country",
          languageSpeakerCounts: [],
          suggestedLanguages: [],
        },
      ])
    })

    it("should handle missing language data", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "YY",
            flagUrlPng: "https://flagcdn.com/w320/yy.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/yy.webp",
            latitude: 0.0,
            longitude: 0.0,
            countryPopulation: 1000000,
            languageCount: 1,
            languageCountHavingMedia: 1,
            continent: {
              englishContinentName: [{ value: "Unknown" }],
              continentName: [],
            },
            englishName: [],
            name: [],
            countryLanguages: [
              {
                suggested: false,
                language: { id: "529" },
              },
            ],
          },
        ],
      })

      const mockCountryLink = {
        id: "YY__529",
        countryId: "YY",
        languageId: "529",
      } as any

      mockDb.objectForPrimaryKey.mockImplementation((type: any, key: any) => {
        if (typeof key !== "string") return null
        if (type === CountryLink && key === "YY__529") return mockCountryLink
        return null
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryId: "YY",
          flagUrlPng: "https://flagcdn.com/w320/yy.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/yy.webp",
          latitude: 0.0,
          longitude: 0.0,
          countryPopulation: 1000000,
          languageCount: 1,
          languageCountHavingMedia: 1,
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishContinentName: "Unknown",
          continentName: "",
          englishName: "",
          name: "",
          languageSpeakerCounts: [mockCountryLink],
          suggestedLanguages: [],
        },
      ])
    })

    it("should handle missing CountryLink and SuggestedLanguage objects", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "ZZ",
            flagUrlPng: "https://flagcdn.com/w320/zz.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/zz.webp",
            latitude: 10.0,
            longitude: 20.0,
            countryPopulation: 5000000,
            languageCount: 3,
            languageCountHavingMedia: 2,
            continent: {
              englishContinentName: [{ value: "Africa" }],
              continentName: [{ value: "Africa" }],
            },
            englishName: [{ value: "Test Country" }],
            name: [{ value: "Test Country" }],
            countryLanguages: [
              {
                suggested: true,
                language: { id: "529" },
              },
              {
                suggested: false,
                language: { id: "21028" },
              },
              {
                suggested: true,
                language: { id: "6930" },
              },
            ],
          },
        ],
      })

      // Mock CountryLink and SuggestedLanguage lookups - some don't exist
      const mockCountryLink = {
        id: "ZZ__529",
        countryId: "ZZ",
        languageId: "529",
      } as any

      mockDb.objectForPrimaryKey.mockImplementation((type: any, key: any) => {
        if (typeof key !== "string") return null

        if (type === CountryLink) {
          if (key === "ZZ__529") return mockCountryLink
          if (key === "ZZ__6930") return mockCountryLink
        }
        return null
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryId: "ZZ",
          flagUrlPng: "https://flagcdn.com/w320/zz.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/zz.webp",
          latitude: 10.0,
          longitude: 20.0,
          countryPopulation: 5000000,
          languageCount: 3,
          languageCountHavingMedia: 2,
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishContinentName: "Africa",
          continentName: "Africa",
          englishName: "Test Country",
          name: "Test Country",
          languageSpeakerCounts: [mockCountryLink, mockCountryLink], // Only existing ones
          suggestedLanguages: [], // None exist
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

      expect(mockDb.write).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "US",
            flagUrlPng: "https://flagcdn.com/w320/us.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/us.webp",
            latitude: 38.0,
            longitude: -97.0,
            countryPopulation: 331002651,
            languageCount: 1,
            languageCountHavingMedia: 1,
            continent: {
              englishContinentName: [{ value: "North America" }],
              continentName: [{ value: "North America" }],
            },
            englishName: [{ value: "United States" }],
            name: [
              {
                value: "United States",
                language: { id: "529", bcp47: "en" },
              },
            ],
            countryLanguages: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      mockDb.write.mockImplementation(() => {
        throw new Error("Database write failed")
      })

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
            flagUrlPng: "https://flagcdn.com/w320/fr.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/fr.webp",
            latitude: 46.0,
            longitude: 2.0,
            countryPopulation: 65273511,
            languageCount: 1,
            languageCountHavingMedia: 1,
            continent: {
              englishContinentName: [{ value: "Europe" }],
              continentName: [{ value: "Europe" }],
            },
            englishName: [{ value: "France" }],
            name: [{ value: "France" }],
            countryLanguages: [
              {
                suggested: true,
                language: { id: "529" },
              },
            ],
          },
        ],
      })

      const mockSuggestedLanguage = {
        id: "FR__529",
        countryId: "FR",
        languageId: "529",
      } as any

      mockDb.objectForPrimaryKey.mockImplementation((type: any, key: any) => {
        if (typeof key !== "string") return null
        if (type === SuggestedLanguage && key === "FR__529") {
          return mockSuggestedLanguage
        }
        return null
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
          flagUrlPng: "https://flagcdn.com/w320/fr.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/fr.webp",
          latitude: 46.0,
          longitude: 2.0,
          countryPopulation: 65273511,
          languageCount: 1,
          languageCountHavingMedia: 1,
          metadataLanguageTag: "he",
          currentDescriptorLanguageId: "6930",
          englishContinentName: "Europe",
          continentName: "Europe",
          englishName: "France",
          name: "France",
          languageSpeakerCounts: [],
          suggestedLanguages: [mockSuggestedLanguage],
        },
      ])
    })

    it("should correctly transform country data structure", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "MX",
            flagUrlPng: "https://flagcdn.com/w320/mx.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/mx.webp",
            latitude: 23.0,
            longitude: -102.0,
            countryPopulation: 128932753,
            languageCount: 2,
            languageCountHavingMedia: 2,
            continent: {
              englishContinentName: [{ value: "North America" }],
              continentName: [{ value: "América del Norte" }],
            },
            englishName: [{ value: "Mexico" }],
            name: [{ value: "México" }],
            countryLanguages: [
              {
                suggested: true,
                language: { id: "21028" },
              },
              {
                suggested: false,
                language: { id: "529" },
              },
            ],
          },
        ],
      })

      const mockCountryLink1 = {
        id: "MX__21028",
        countryId: "MX",
        languageId: "21028",
      } as any
      const mockCountryLink2 = {
        id: "MX__529",
        countryId: "MX",
        languageId: "529",
      } as any
      const mockSuggestedLanguage = {
        id: "MX__21028",
        countryId: "MX",
        languageId: "21028",
      } as any

      mockDb.objectForPrimaryKey.mockImplementation((type: any, key: any) => {
        if (typeof key !== "string") return null
        if (type === CountryLink) {
          if (key === "MX__21028") return mockCountryLink1
          if (key === "MX__529") return mockCountryLink2
        }
        if (type === SuggestedLanguage) {
          if (key === "MX__21028") return mockSuggestedLanguage
        }
        return null
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
          flagUrlPng: "https://flagcdn.com/w320/mx.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/mx.webp",
          latitude: 23.0,
          longitude: -102.0,
          countryPopulation: 128932753,
          languageCount: 2,
          languageCountHavingMedia: 2,
          metadataLanguageTag: "es",
          currentDescriptorLanguageId: "21028",
          englishContinentName: "North America",
          continentName: "América del Norte",
          englishName: "Mexico",
          name: "México",
          languageSpeakerCounts: [mockCountryLink1, mockCountryLink2],
          suggestedLanguages: [mockSuggestedLanguage],
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.create).toHaveBeenCalledWith(
        Country,
        {
          countryId: "MX",
          flagUrlPng: "https://flagcdn.com/w320/mx.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/mx.webp",
          latitude: 23.0,
          longitude: -102.0,
          countryPopulation: 128932753,
          languageCount: 2,
          languageCountHavingMedia: 2,
          metadataLanguageTag: "es",
          currentDescriptorLanguageId: "21028",
          englishContinentName: "North America",
          continentName: "América del Norte",
          englishName: "Mexico",
          name: "México",
          languageSpeakerCounts: [mockCountryLink1, mockCountryLink2],
          suggestedLanguages: [mockSuggestedLanguage],
        },
        Realm.UpdateMode.Modified
      )
    })

    it("should handle multiple countries with different language configurations", async () => {
      const mockApiResponse = createMockResponse({
        countries: [
          {
            countryId: "FR",
            flagUrlPng: "https://flagcdn.com/w320/fr.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/fr.webp",
            latitude: 46.0,
            longitude: 2.0,
            countryPopulation: 65273511,
            languageCount: 1,
            languageCountHavingMedia: 1,
            continent: {
              englishContinentName: [{ value: "Europe" }],
              continentName: [{ value: "Europe" }],
            },
            englishName: [{ value: "France" }],
            name: [{ value: "France" }],
            countryLanguages: [
              {
                suggested: true,
                language: { id: "529" },
              },
            ],
          },
          {
            countryId: "DE",
            flagUrlPng: "https://flagcdn.com/w320/de.png",
            flagUrlWebPLossy50: "https://flagcdn.com/w320/de.webp",
            latitude: 51.0,
            longitude: 10.0,
            countryPopulation: 83783942,
            languageCount: 2,
            languageCountHavingMedia: 1,
            continent: {
              englishContinentName: [{ value: "Europe" }],
              continentName: [{ value: "Europe" }],
            },
            englishName: [{ value: "Germany" }],
            name: [{ value: "Germany" }],
            countryLanguages: [
              {
                suggested: false,
                language: { id: "529" },
              },
              {
                suggested: true,
                language: { id: "21028" },
              },
            ],
          },
        ],
      })

      const mockCountryLinkFR = {
        id: "FR__529",
        countryId: "FR",
        languageId: "529",
      } as any
      const mockCountryLinkDE1 = {
        id: "DE__529",
        countryId: "DE",
        languageId: "529",
      } as any
      const mockCountryLinkDE2 = {
        id: "DE__21028",
        countryId: "DE",
        languageId: "21028",
      } as any
      const mockSuggestedLanguageFR = {
        id: "FR__529",
        countryId: "FR",
        languageId: "529",
      } as any
      const mockSuggestedLanguageDE = {
        id: "DE__21028",
        countryId: "DE",
        languageId: "21028",
      } as any

      mockDb.objectForPrimaryKey.mockImplementation((type: any, key: any) => {
        if (typeof key !== "string") return null

        if (type === CountryLink) {
          if (key === "FR__529") return mockCountryLinkFR
          if (key === "DE__529") return mockCountryLinkDE1
          if (key === "DE__21028") return mockCountryLinkDE2
        }
        if (type === SuggestedLanguage) {
          if (key === "FR__529") return mockSuggestedLanguageFR
          if (key === "DE__21028") return mockSuggestedLanguageDE
        }
        return null
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformCountries({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          countryId: "FR",
          flagUrlPng: "https://flagcdn.com/w320/fr.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/fr.webp",
          latitude: 46.0,
          longitude: 2.0,
          countryPopulation: 65273511,
          languageCount: 1,
          languageCountHavingMedia: 1,
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishContinentName: "Europe",
          continentName: "Europe",
          englishName: "France",
          name: "France",
          languageSpeakerCounts: [mockCountryLinkFR],
          suggestedLanguages: [mockSuggestedLanguageFR],
        },
        {
          countryId: "DE",
          flagUrlPng: "https://flagcdn.com/w320/de.png",
          flagUrlWebPLossy50: "https://flagcdn.com/w320/de.webp",
          latitude: 51.0,
          longitude: 10.0,
          countryPopulation: 83783942,
          languageCount: 2,
          languageCountHavingMedia: 1,
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishContinentName: "Europe",
          continentName: "Europe",
          englishName: "Germany",
          name: "Germany",
          languageSpeakerCounts: [mockCountryLinkDE1, mockCountryLinkDE2],
          suggestedLanguages: [mockSuggestedLanguageDE],
        },
      ])
    })
  })
})
