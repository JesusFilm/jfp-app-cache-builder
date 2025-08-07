import { Buffer } from "buffer"

import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { languages } from "../../../lib/languages.js"
import { getDb } from "../../lib/db.js"

import { ReadingLanguageData } from "./realm.js"
import { transformReadingLanguageData } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/languages.js")
vi.mock("../../lib/db.js")
vi.mock("../bibleCode/transform.js")
vi.mock("../countryLink/transform.js")
vi.mock("../language/transform.js")
vi.mock("../mediaItem/transform.js")

const mockGetDb = vi.mocked(getDb)
const mockLanguages = vi.mocked(languages)

describe("transformReadingLanguageData", () => {
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

    // Mock the languages array
    mockLanguages.length = 0
    mockLanguages.push(
      { tag: "es", name: "Spanish", nameNative: "Español", id: 21028 },
      { tag: "fr", name: "French", nameNative: "le français", id: 496 },
      { tag: "de", name: "German", nameNative: "Deutsche", id: 1106 }
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform data for all languages except English", async () => {
      // Mock the sub-transformers
      const { transformBibleCodes } = await import("../bibleCode/transform.js")
      const { transformCountryLinks } = await import(
        "../countryLink/transform.js"
      )
      const { transformLanguages } = await import("../language/transform.js")
      const { transformMediaItems } = await import("../mediaItem/transform.js")

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformCountryLinks).mockResolvedValue([])
      vi.mocked(transformLanguages).mockResolvedValue([])
      vi.mocked(transformMediaItems).mockResolvedValue([])

      const result = await transformReadingLanguageData({
        languageId: "529",
        languageTag: "en",
      })

      // Should process es, fr, and de (excluding en)
      expect(result).toHaveLength(3)

      // Verify the structure of returned data
      expect(result[0]).toEqual({
        readingLanguageId: "21028", // Spanish language ID
        metadataLanguageTag: "es",
        bibleCodeData: Buffer.from(JSON.stringify([])),
        countryData: Buffer.from(JSON.stringify([])),
        languageData: Buffer.from(JSON.stringify([])),
        mediaItemData: Buffer.from(JSON.stringify([])),
      })

      expect(result[1]).toEqual({
        readingLanguageId: "496", // French language ID
        metadataLanguageTag: "fr",
        bibleCodeData: Buffer.from(JSON.stringify([])),
        countryData: Buffer.from(JSON.stringify([])),
        languageData: Buffer.from(JSON.stringify([])),
        mediaItemData: Buffer.from(JSON.stringify([])),
      })

      expect(result[2]).toEqual({
        readingLanguageId: "1106", // German language ID
        metadataLanguageTag: "de",
        bibleCodeData: Buffer.from(JSON.stringify([])),
        countryData: Buffer.from(JSON.stringify([])),
        languageData: Buffer.from(JSON.stringify([])),
        mediaItemData: Buffer.from(JSON.stringify([])),
      })

      // Verify getDb was called
      expect(mockGetDb).toHaveBeenCalled()

      // Verify database writes
      expect(mockDb.write).toHaveBeenCalledTimes(3)
      expect(mockDb.create).toHaveBeenCalledTimes(3)
      expect(mockDb.create).toHaveBeenCalledWith(
        ReadingLanguageData,
        result[0],
        Realm.UpdateMode.Modified
      )
    })
  })

  describe("edge cases", () => {
    it("should handle empty languages array", async () => {
      // Mock empty languages array
      mockLanguages.length = 0

      const result = await transformReadingLanguageData({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.write).not.toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle languages array with only English", async () => {
      // Mock languages array with only English
      mockLanguages.length = 0
      mockLanguages.push({
        tag: "en",
        name: "English",
        nameNative: "English",
        id: 529,
      })

      const result = await transformReadingLanguageData({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.write).not.toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle single language entry correctly", async () => {
      // Mock languages array with only one non-English language
      mockLanguages.length = 0
      mockLanguages.push({
        tag: "pt",
        name: "Portuguese",
        nameNative: "Português",
        id: 584,
      })

      // Mock the sub-transformers
      const { transformBibleCodes } = await import("../bibleCode/transform.js")
      const { transformCountryLinks } = await import(
        "../countryLink/transform.js"
      )
      const { transformLanguages } = await import("../language/transform.js")
      const { transformMediaItems } = await import("../mediaItem/transform.js")

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformCountryLinks).mockResolvedValue([])
      vi.mocked(transformLanguages).mockResolvedValue([])
      vi.mocked(transformMediaItems).mockResolvedValue([])

      const result = await transformReadingLanguageData({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        readingLanguageId: "584", // Portuguese language ID
        metadataLanguageTag: "pt",
        bibleCodeData: Buffer.from(JSON.stringify([])),
        countryData: Buffer.from(JSON.stringify([])),
        languageData: Buffer.from(JSON.stringify([])),
        mediaItemData: Buffer.from(JSON.stringify([])),
      })

      expect(mockDb.write).toHaveBeenCalledTimes(1)
      expect(mockDb.create).toHaveBeenCalledTimes(1)
    })
  })

  describe("error handling", () => {
    it("should handle sub-transformer errors", async () => {
      // Mock languages array
      mockLanguages.length = 0
      mockLanguages.push({
        tag: "es",
        name: "Spanish",
        nameNative: "Español",
        id: 21028,
      })

      const { transformBibleCodes } = await import("../bibleCode/transform.js")
      vi.mocked(transformBibleCodes).mockRejectedValue(
        new Error("Bible codes transform failed")
      )

      await expect(
        transformReadingLanguageData({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Bible codes transform failed")

      expect(mockDb.write).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      // Mock languages array
      mockLanguages.length = 0
      mockLanguages.push({
        tag: "es",
        name: "Spanish",
        nameNative: "Español",
        id: 21028,
      })

      // Mock the sub-transformers
      const { transformBibleCodes } = await import("../bibleCode/transform.js")
      const { transformCountryLinks } = await import(
        "../countryLink/transform.js"
      )
      const { transformLanguages } = await import("../language/transform.js")
      const { transformMediaItems } = await import("../mediaItem/transform.js")

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformCountryLinks).mockResolvedValue([])
      vi.mocked(transformLanguages).mockResolvedValue([])
      vi.mocked(transformMediaItems).mockResolvedValue([])

      mockDb.write.mockImplementation(() => {
        throw new Error("Database write failed")
      })

      await expect(
        transformReadingLanguageData({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should call sub-transformers with correct parameters", async () => {
      // Mock languages array
      mockLanguages.length = 0
      mockLanguages.push({
        tag: "pt",
        name: "Portuguese",
        nameNative: "Português",
        id: 584,
      })

      // Mock the sub-transformers
      const { transformBibleCodes } = await import("../bibleCode/transform.js")
      const { transformCountryLinks } = await import(
        "../countryLink/transform.js"
      )
      const { transformLanguages } = await import("../language/transform.js")
      const { transformMediaItems } = await import("../mediaItem/transform.js")

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformCountryLinks).mockResolvedValue([])
      vi.mocked(transformLanguages).mockResolvedValue([])
      vi.mocked(transformMediaItems).mockResolvedValue([])

      await transformReadingLanguageData({
        languageId: "529",
        languageTag: "en",
      })

      // Verify all sub-transformers are called with read-only mode
      expect(transformBibleCodes).toHaveBeenCalledWith({
        languageId: "584", // Portuguese language ID
        languageTag: "pt",
        readOnly: true,
      })

      expect(transformCountryLinks).toHaveBeenCalledWith({
        languageId: "584",
        languageTag: "pt",
        readOnly: true,
      })

      expect(transformLanguages).toHaveBeenCalledWith({
        languageId: "584",
        languageTag: "pt",
        readOnly: true,
      })

      expect(transformMediaItems).toHaveBeenCalledWith({
        languageId: "584",
        languageTag: "pt",
        readOnly: true,
      })
    })

    it("should create correct Buffer data from JSON", async () => {
      // Mock languages array
      mockLanguages.length = 0
      mockLanguages.push({
        tag: "zh-Hans",
        name: "Chinese",
        nameNative: "中国",
        id: 21754,
      })

      const mockData = [{ test: "data", numbers: [1, 2, 3] }] as any

      // Mock the sub-transformers
      const { transformBibleCodes } = await import("../bibleCode/transform.js")
      const { transformCountryLinks } = await import(
        "../countryLink/transform.js"
      )
      const { transformLanguages } = await import("../language/transform.js")
      const { transformMediaItems } = await import("../mediaItem/transform.js")

      vi.mocked(transformBibleCodes).mockResolvedValue(mockData)
      vi.mocked(transformCountryLinks).mockResolvedValue(mockData)
      vi.mocked(transformLanguages).mockResolvedValue(mockData)
      vi.mocked(transformMediaItems).mockResolvedValue(mockData)

      const result = await transformReadingLanguageData({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toHaveLength(1)

      // Verify Buffer content can be parsed back to original data
      const bibleCodeData = JSON.parse(result[0]!.bibleCodeData!.toString())
      expect(bibleCodeData).toEqual(mockData)

      const countryData = JSON.parse(result[0]!.countryData!.toString())
      expect(countryData).toEqual(mockData)

      const languageData = JSON.parse(result[0]!.languageData!.toString())
      expect(languageData).toEqual(mockData)

      const mediaItemData = JSON.parse(result[0]!.mediaItemData!.toString())
      expect(mediaItemData).toEqual(mockData)
    })
  })
})
