import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"
import { getDb } from "../../lib/db.js"

import { Language } from "./realm.js"
import { transformLanguages } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js")

const mockClient = vi.mocked(client)
const mockGetDb = vi.mocked(getDb)

describe("transformLanguages", () => {
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
    it("should transform languages and write to database", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "529",
            audioPreviewURL: { value: "https://audio.example.com/en.mp3" },
            iso3: "eng",
            bcp47: "en",
            englishName: [{ value: "English" }],
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            countryLanguages: [
              {
                country: { id: "US" },
                primary: true,
                speakerCount: 250000000,
              },
              {
                country: { id: "CA" },
                primary: false,
                speakerCount: 20000000,
              },
            ],
          },
          {
            id: "21028",
            audioPreviewURL: { value: "https://audio.example.com/es.mp3" },
            iso3: "spa",
            bcp47: "es",
            englishName: [{ value: "Spanish" }],
            name: [{ value: "Español" }],
            nameNative: [{ value: "Español" }],
            countryLanguages: [
              {
                country: { id: "MX" },
                primary: true,
                speakerCount: 120000000,
              },
              {
                country: { id: "ES" },
                primary: false,
                speakerCount: 47000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformLanguages({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { languageId: "529" },
      })

      // Verify getDb was called
      expect(mockGetDb).toHaveBeenCalled()

      // Verify database write was called
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).toHaveBeenCalledTimes(2)

      // Verify the transformed data
      expect(result).toEqual([
        {
          languageId: "529",
          audioPreviewURL: "https://audio.example.com/en.mp3",
          speakerCount: 270000000,
          iso3: "eng",
          primaryCountryId: "US",
          numCountries: 2,
          bcp47: "en",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "English",
          name: "English",
          nameNative: "English",
        },
        {
          languageId: "21028",
          audioPreviewURL: "https://audio.example.com/es.mp3",
          speakerCount: 167000000,
          iso3: "spa",
          primaryCountryId: "MX",
          numCountries: 2,
          bcp47: "es",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "Spanish",
          name: "Español",
          nameNative: "Español",
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.create).toHaveBeenCalledWith(
        Language,
        {
          languageId: "529",
          audioPreviewURL: "https://audio.example.com/en.mp3",
          speakerCount: 270000000,
          iso3: "eng",
          primaryCountryId: "US",
          numCountries: 2,
          bcp47: "en",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "English",
          name: "English",
          nameNative: "English",
        },
        Realm.UpdateMode.Modified
      )
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "6930",
            audioPreviewURL: { value: "https://audio.example.com/he.mp3" },
            iso3: "heb",
            bcp47: "he",
            englishName: [{ value: "Hebrew" }],
            name: [{ value: "עברית" }],
            nameNative: [{ value: "עברית" }],
            countryLanguages: [
              {
                country: { id: "IL" },
                primary: true,
                speakerCount: 5000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformLanguages({
        languageId: "6930",
        languageTag: "he",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(mockDb.write).not.toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          languageId: "6930",
          audioPreviewURL: "https://audio.example.com/he.mp3",
          speakerCount: 5000000,
          iso3: "heb",
          primaryCountryId: "IL",
          numCountries: 1,
          bcp47: "he",
          metadataLanguageTag: "he",
          currentDescriptorLanguageId: "6930",
          englishName: "Hebrew",
          name: "עברית",
          nameNative: "עברית",
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

      const result = await transformLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle missing optional fields", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "XX",
            audioPreviewURL: null,
            iso3: null,
            bcp47: null,
            englishName: [],
            name: [],
            nameNative: [],
            countryLanguages: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "XX",
          audioPreviewURL: undefined,
          speakerCount: 0,
          iso3: "",
          primaryCountryId: "",
          numCountries: 0,
          bcp47: undefined,
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "",
          name: "",
          nameNative: "",
        },
      ])
    })

    it("should handle missing speaker counts", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "YY",
            audioPreviewURL: { value: "https://audio.example.com/yy.mp3" },
            iso3: "yyy",
            bcp47: "yy",
            englishName: [{ value: "Test Language" }],
            name: [{ value: "Test Language" }],
            nameNative: [{ value: "Test Language" }],
            countryLanguages: [
              {
                country: { id: "XX" },
                primary: true,
                speakerCount: null,
              },
              {
                country: { id: "YY" },
                primary: false,
                speakerCount: null,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "YY",
          audioPreviewURL: "https://audio.example.com/yy.mp3",
          speakerCount: 0,
          iso3: "yyy",
          primaryCountryId: "XX",
          numCountries: 2,
          bcp47: "yy",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "Test Language",
          name: "Test Language",
          nameNative: "Test Language",
        },
      ])
    })

    it("should handle languages with no primary country", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "ZZ",
            audioPreviewURL: { value: "https://audio.example.com/zz.mp3" },
            iso3: "zzz",
            bcp47: "zz",
            englishName: [{ value: "Unknown Language" }],
            name: [{ value: "Unknown Language" }],
            nameNative: [{ value: "Unknown Language" }],
            countryLanguages: [
              {
                country: { id: "AA" },
                primary: false,
                speakerCount: 1000000,
              },
              {
                country: { id: "BB" },
                primary: false,
                speakerCount: 500000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "ZZ",
          audioPreviewURL: "https://audio.example.com/zz.mp3",
          speakerCount: 1500000,
          iso3: "zzz",
          primaryCountryId: "",
          numCountries: 2,
          bcp47: "zz",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "Unknown Language",
          name: "Unknown Language",
          nameNative: "Unknown Language",
        },
      ])
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.write).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "US",
            audioPreviewURL: { value: "https://audio.example.com/us.mp3" },
            iso3: "usa",
            bcp47: "us",
            englishName: [{ value: "Test Language" }],
            name: [{ value: "Test Language" }],
            nameNative: [{ value: "Test Language" }],
            countryLanguages: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      mockDb.write.mockImplementation(() => {
        throw new Error("Database write failed")
      })

      await expect(
        transformLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly calculate speaker counts", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "TEST",
            audioPreviewURL: { value: "https://audio.example.com/test.mp3" },
            iso3: "tst",
            bcp47: "test",
            englishName: [{ value: "Test Language" }],
            name: [{ value: "Test Language" }],
            nameNative: [{ value: "Test Language" }],
            countryLanguages: [
              {
                country: { id: "A1" },
                primary: true,
                speakerCount: 1000000,
              },
              {
                country: { id: "A2" },
                primary: false,
                speakerCount: 2000000,
              },
              {
                country: { id: "A3" },
                primary: false,
                speakerCount: 3000000,
              },
              {
                country: { id: "A4" },
                primary: false,
                speakerCount: null,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "TEST",
          audioPreviewURL: "https://audio.example.com/test.mp3",
          speakerCount: 6000000, // 1000000 + 2000000 + 3000000 + 0 (null)
          iso3: "tst",
          primaryCountryId: "A1",
          numCountries: 4,
          bcp47: "test",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "Test Language",
          name: "Test Language",
          nameNative: "Test Language",
        },
      ])
    })

    it("should handle multiple languages with different configurations", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "FR",
            audioPreviewURL: { value: "https://audio.example.com/fr.mp3" },
            iso3: "fra",
            bcp47: "fr",
            englishName: [{ value: "French" }],
            name: [{ value: "Français" }],
            nameNative: [{ value: "Français" }],
            countryLanguages: [
              {
                country: { id: "FR" },
                primary: true,
                speakerCount: 67000000,
              },
              {
                country: { id: "CA" },
                primary: false,
                speakerCount: 7000000,
              },
            ],
          },
          {
            id: "DE",
            audioPreviewURL: { value: "https://audio.example.com/de.mp3" },
            iso3: "deu",
            bcp47: "de",
            englishName: [{ value: "German" }],
            name: [{ value: "Deutsch" }],
            nameNative: [{ value: "Deutsch" }],
            countryLanguages: [
              {
                country: { id: "DE" },
                primary: true,
                speakerCount: 83000000,
              },
              {
                country: { id: "AT" },
                primary: false,
                speakerCount: 8000000,
              },
              {
                country: { id: "CH" },
                primary: false,
                speakerCount: 5000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          languageId: "FR",
          audioPreviewURL: "https://audio.example.com/fr.mp3",
          speakerCount: 74000000,
          iso3: "fra",
          primaryCountryId: "FR",
          numCountries: 2,
          bcp47: "fr",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "French",
          name: "Français",
          nameNative: "Français",
        },
        {
          languageId: "DE",
          audioPreviewURL: "https://audio.example.com/de.mp3",
          speakerCount: 96000000,
          iso3: "deu",
          primaryCountryId: "DE",
          numCountries: 3,
          bcp47: "de",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishName: "German",
          name: "Deutsch",
          nameNative: "Deutsch",
        },
      ])
    })

    it("should correctly use languageId and languageTag parameters", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            id: "21028",
            audioPreviewURL: { value: "https://audio.example.com/es.mp3" },
            iso3: "spa",
            bcp47: "es",
            englishName: [{ value: "Spanish" }],
            name: [{ value: "Español" }],
            nameNative: [{ value: "Español" }],
            countryLanguages: [
              {
                country: { id: "ES" },
                primary: true,
                speakerCount: 47000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformLanguages({
        languageId: "21028",
        languageTag: "es",
      })

      // Verify the language parameters are used correctly
      expect(result).toEqual([
        {
          languageId: "21028",
          audioPreviewURL: "https://audio.example.com/es.mp3",
          speakerCount: 47000000,
          iso3: "spa",
          primaryCountryId: "ES",
          numCountries: 1,
          bcp47: "es",
          metadataLanguageTag: "es",
          currentDescriptorLanguageId: "21028",
          englishName: "Spanish",
          name: "Español",
          nameNative: "Español",
        },
      ])
    })
  })
})
