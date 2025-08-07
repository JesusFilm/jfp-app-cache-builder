import { describe, expect, it, vi, beforeEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { transformMediaLanguages } from "./transform.js"

vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({ db: prisma }))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformMediaLanguages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  describe("successful transformation", () => {
    it("should transform languages and write to database", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio.mp3" },
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
            mediaLanguageId: "lang2",
            name: [{ value: "Spanish" }],
            nameNative: [{ value: "Español" }],
            iso3: "spa",
            bcp47: "es",
            audioPreviewURL: { value: "https://example.com/audio2.mp3" },
            countryLanguages: [
              {
                country: { id: "ES" },
                primary: true,
                speakerCount: 45000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(2)

      // Verify first language
      expect(result[0]).toEqual({
        mediaLanguageId: "lang1",
        name: "English",
        nameNative: "English",
        iso3: "eng",
        bcp47: "en",
        speakerCount: 270000000, // 250000000 + 20000000
        audioPreviewUrl: "https://example.com/audio.mp3",
        primaryCountryId: "US",
      })

      // Verify second language
      expect(result[1]).toEqual({
        mediaLanguageId: "lang2",
        name: "Spanish",
        nameNative: "Español",
        iso3: "spa",
        bcp47: "es",
        speakerCount: 45000000,
        audioPreviewUrl: "https://example.com/audio2.mp3",
        primaryCountryId: "ES",
      })

      // Verify database create was called for each language
      expect(mockDb.media_languages.create).toHaveBeenCalledTimes(2)

      // Verify first language database call
      expect(mockDb.media_languages.create).toHaveBeenCalledWith({
        data: {
          mediaLanguageId: "lang1",
          name: "English",
          nameNative: "English",
          iso3: "eng",
          bcp47: "en",
          speakerCount: 270000000,
          audioPreviewUrl: "https://example.com/audio.mp3",
          primaryCountryId: "US",
        },
      })

      // Verify second language database call
      expect(mockDb.media_languages.create).toHaveBeenCalledWith({
        data: {
          mediaLanguageId: "lang2",
          name: "Spanish",
          nameNative: "Español",
          iso3: "spa",
          bcp47: "es",
          speakerCount: 45000000,
          audioPreviewUrl: "https://example.com/audio2.mp3",
          primaryCountryId: "ES",
        },
      })
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio.mp3" },
            countryLanguages: [
              {
                country: { id: "US" },
                primary: true,
                speakerCount: 250000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        mediaLanguageId: "lang1",
        name: "English",
        nameNative: "English",
        iso3: "eng",
        bcp47: "en",
        speakerCount: 250000000,
        audioPreviewUrl: "https://example.com/audio.mp3",
        primaryCountryId: "US",
      })

      // Verify no database write in read-only mode
      expect(mockDb.media_languages.create).not.toHaveBeenCalled()
    })
  })

  describe("edge cases", () => {
    it("should handle empty languages array", async () => {
      const mockApiResponse = createMockResponse({
        languages: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.media_languages.create).not.toHaveBeenCalled()
    })

    it("should handle languages with no country languages", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio.mp3" },
            countryLanguages: [],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        mediaLanguageId: "lang1",
        name: "English",
        nameNative: "English",
        iso3: "eng",
        bcp47: "en",
        speakerCount: 0,
        audioPreviewUrl: "https://example.com/audio.mp3",
        primaryCountryId: "",
      })
    })

    it("should handle languages with no primary country", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio.mp3" },
            countryLanguages: [
              {
                country: { id: "US" },
                primary: false,
                speakerCount: 250000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        mediaLanguageId: "lang1",
        name: "English",
        nameNative: "English",
        iso3: "eng",
        bcp47: "en",
        speakerCount: 250000000,
        audioPreviewUrl: "https://example.com/audio.mp3",
        primaryCountryId: "",
      })
    })

    it("should handle missing optional fields", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: null,
            bcp47: null,
            audioPreviewURL: null,
            countryLanguages: [
              {
                country: { id: "US" },
                primary: true,
                speakerCount: null,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        mediaLanguageId: "lang1",
        name: "English",
        nameNative: "English",
        iso3: "",
        bcp47: "",
        speakerCount: 0,
        audioPreviewUrl: null,
        primaryCountryId: "US",
      })
    })

    it("should handle missing name arrays", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [],
            nameNative: [],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio.mp3" },
            countryLanguages: [
              {
                country: { id: "US" },
                primary: true,
                speakerCount: 250000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        mediaLanguageId: "lang1",
        name: "",
        nameNative: "",
        iso3: "eng",
        bcp47: "en",
        speakerCount: 250000000,
        audioPreviewUrl: "https://example.com/audio.mp3",
        primaryCountryId: "US",
      })
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformMediaLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.media_languages.create).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio.mp3" },
            countryLanguages: [
              {
                country: { id: "US" },
                primary: true,
                speakerCount: 250000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      ;(mockDb.media_languages.create as any).mockRejectedValue(
        new Error("Database write failed")
      )

      await expect(
        transformMediaLanguages({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly sum speaker counts from multiple countries", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio.mp3" },
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
              {
                country: { id: "UK" },
                primary: false,
                speakerCount: 60000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.speakerCount).toBe(330000000) // 250000000 + 20000000 + 60000000
    })

    it("should correctly identify primary country", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio.mp3" },
            countryLanguages: [
              {
                country: { id: "US" },
                primary: false,
                speakerCount: 250000000,
              },
              {
                country: { id: "CA" },
                primary: true,
                speakerCount: 20000000,
              },
              {
                country: { id: "UK" },
                primary: false,
                speakerCount: 60000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.primaryCountryId).toBe("CA")
    })

    it("should handle multiple languages with different configurations", async () => {
      const mockApiResponse = createMockResponse({
        languages: [
          {
            mediaLanguageId: "lang1",
            name: [{ value: "English" }],
            nameNative: [{ value: "English" }],
            iso3: "eng",
            bcp47: "en",
            audioPreviewURL: { value: "https://example.com/audio1.mp3" },
            countryLanguages: [
              {
                country: { id: "US" },
                primary: true,
                speakerCount: 250000000,
              },
            ],
          },
          {
            mediaLanguageId: "lang2",
            name: [{ value: "Spanish" }],
            nameNative: [{ value: "Español" }],
            iso3: "spa",
            bcp47: "es",
            audioPreviewURL: null,
            countryLanguages: [
              {
                country: { id: "ES" },
                primary: true,
                speakerCount: 45000000,
              },
              {
                country: { id: "MX" },
                primary: false,
                speakerCount: 120000000,
              },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguages({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(2)

      // Verify first language
      expect(result[0]).toEqual({
        mediaLanguageId: "lang1",
        name: "English",
        nameNative: "English",
        iso3: "eng",
        bcp47: "en",
        speakerCount: 250000000,
        audioPreviewUrl: "https://example.com/audio1.mp3",
        primaryCountryId: "US",
      })

      // Verify second language
      expect(result[1]).toEqual({
        mediaLanguageId: "lang2",
        name: "Spanish",
        nameNative: "Español",
        iso3: "spa",
        bcp47: "es",
        speakerCount: 165000000, // 45000000 + 120000000
        audioPreviewUrl: null,
        primaryCountryId: "ES",
      })
    })
  })
})
