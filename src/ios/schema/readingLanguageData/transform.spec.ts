import { Buffer } from "buffer"

import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { client } from "../../../lib/client.js"
import { languages } from "../../../lib/languages.js"
import { createMockResponse } from "../../../lib/test-utils.js"
import { getDb } from "../../lib/db.js"

import { ReadingLanguageData } from "./realm.js"
import { transformReadingLanguageData } from "./transform.js"

vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js")

const mockGetDb = vi.mocked(getDb)
const mockClient = vi.mocked(client)
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
      { tag: "en", name: "English", nameNative: "English", id: 529 },
      { tag: "es", name: "Spanish", nameNative: "Español", id: 21028 },
      { tag: "fr", name: "French", nameNative: "le français", id: 496 },
      { tag: "de", name: "German", nameNative: "Deutsche", id: 1106 }
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform data", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        bibleCodeData: [
          {
            name: "Gen",
            fullName: [{ value: "Genesis" }],
          },
        ],
        countryData: [
          {
            name: [{ value: "Spain Primary" }, { value: "Spain Secondary" }],
            continent: {
              name: [
                { value: "Europe Primary" },
                { value: "Europe Secondary" },
              ],
            },
          },
        ],
        languageData: [
          {
            name: [
              { value: "Spanish Primary" },
              { value: "Spanish Secondary" },
            ],
            nameNative: [{ value: "Español" }],
          },
        ],
        mediaItemData: [
          {
            mediaComponentId: "video1",
            longDescription: [
              { value: "Long description Primary" },
              { value: "Long description Secondary" },
            ],
            shortDescription: [
              { value: "Short description Primary" },
              { value: "Short description Secondary" },
            ],
            name: [
              { value: "Video 1 Primary" },
              { value: "Video 1 Secondary" },
            ],
            studyQuestions: [{ value: "Question 1" }],
            bibleCitations: [
              {
                osisBibleBook: "Gen",
                verseStart: 1,
                verseEnd: null,
                chapterStart: 1,
                chapterEnd: null,
              },
              {
                osisBibleBook: "John",
                verseStart: 1,
                verseEnd: 2,
                chapterStart: 1,
                chapterEnd: 2,
              },
            ],
          },
          {
            mediaComponentId: "video2",
            longDescription: [],
            shortDescription: [],
            name: [],
            studyQuestions: [],
            bibleCitations: [],
          },
        ],
      })

      mockClient.query.mockResolvedValueOnce(mockApiResponse)
      mockClient.query.mockResolvedValue(
        createMockResponse({
          bibleCodeData: [],
          countryData: [],
          languageData: [],
          mediaItemData: [],
        })
      )

      const result = await transformReadingLanguageData({
        languageId: "529",
        languageTag: "en",
      })

      // Should process es, fr, and de (excluding en)
      expect(result).toHaveLength(3)

      // Verify the structure of returned data
      expect(result[0]!.readingLanguageId).toEqual("21028")
      expect(result[0]!.metadataLanguageTag).toEqual("es")
      expect(JSON.parse(result[0]!.bibleCodeData.toString())).toEqual([
        {
          name: "Gen",
          fullName: "Genesis",
          metadataLanguageTag: "es",
        },
      ])
      expect(JSON.parse(result[0]!.countryData.toString())).toEqual([
        {
          name: "Spain Secondary",
          continentName: "Europe Secondary",
          metadataLanguageTag: "es",
        },
      ])
      expect(JSON.parse(result[0]!.languageData.toString())).toEqual([
        {
          name: "Spanish Secondary",
          nameNative: "Español",
          metadataLanguageTag: "es",
        },
      ])
      expect(JSON.parse(result[0]!.mediaItemData.toString())).toEqual([
        {
          mediaComponentId: "video1",
          longDescription: "Long description Secondary",
          shortDescription: "Short description Secondary",
          name: "Video 1 Secondary",
          studyQuestions: ["Question 1"],
          bibleCitations: [
            {
              osisBibleBook: "Gen",
              verseStart: 1,
              verseEnd: 0,
              chapterStart: 1,
              chapterEnd: 0,
            },
            {
              osisBibleBook: "John",
              verseStart: 1,
              verseEnd: 2,
              chapterStart: 1,
              chapterEnd: 2,
            },
          ],
          metadataLanguageTag: "es",
        },
        {
          mediaComponentId: "video2",
          longDescription: "",
          shortDescription: "",
          name: "",
          studyQuestions: [],
          bibleCitations: [],
          metadataLanguageTag: "es",
        },
      ])

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
  })
})
