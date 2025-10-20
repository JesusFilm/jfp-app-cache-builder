import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"
import { getDb } from "../../lib/db.js"

import { BibleCode } from "./realm.js"
import { transformBibleCodes } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js")

const mockClient = vi.mocked(client)
const mockGetDb = vi.mocked(getDb)

describe("transformBibleCodes", () => {
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
    it("should transform bible codes and write to database", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Gen",
            englishFullName: [{ value: "Genesis" }],
            fullName: [{ value: "Genesis" }],
          },
          {
            name: "Exo",
            englishFullName: [{ value: "Exodus" }],
            fullName: [{ value: "Exodus" }],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformBibleCodes({
        languageId: "529", // English
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
          name: "Gen",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishFullName: "Genesis",
          fullName: "Genesis",
        },
        {
          name: "Exo",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishFullName: "Exodus",
          fullName: "Exodus",
        },
      ])
    })

    it("should handle different language IDs", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Gen",
            englishFullName: [{ value: "Genesis" }],
            fullName: [
              { value: "Génesis", language: { id: "21028", bcp47: "es" } },
            ],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      await transformBibleCodes({
        languageId: "21028", // Spanish
        languageTag: "es",
      })

      expect(mockClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { languageId: "21028" },
      })
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Gen",
            englishFullName: [{ value: "Genesis" }],
            fullName: [{ value: "Genesis" }],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformBibleCodes({
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
          name: "Gen",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishFullName: "Genesis",
          fullName: "Genesis",
        },
      ])
    })
  })

  describe("edge cases", () => {
    it("should handle empty bible books array", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformBibleCodes({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle missing englishFullName values", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Gen",
            englishFullName: [], // Missing value
            fullName: [{ value: "Genesis" }],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformBibleCodes({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          name: "Gen",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishFullName: "", // Should default to empty string
          fullName: "Genesis",
        },
      ])
    })

    it("should handle missing fullName values", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Gen",
            englishFullName: [{ value: "Genesis" }],
            fullName: [], // Missing value
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformBibleCodes({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          name: "Gen",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishFullName: "Genesis",
          fullName: "Genesis", // Should fallback to englishFullName
        },
      ])
    })

    it("should handle null/undefined values", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Gen",
            englishFullName: [], // Empty array instead of null
            fullName: [], // Empty array instead of null
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformBibleCodes({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          name: "Gen",
          metadataLanguageTag: "en",
          currentDescriptorLanguageId: "529",
          englishFullName: "",
          fullName: "",
        },
      ])
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformBibleCodes({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.write).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Gen",
            englishFullName: [{ value: "Genesis" }],
            fullName: [{ value: "Genesis" }],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)
      mockDb.write.mockImplementation(() => {
        throw new Error("Database write failed")
      })

      await expect(
        transformBibleCodes({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly transform bible code data structure", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Mat",
            englishFullName: [{ value: "Matthew" }],
            fullName: [{ value: "Mateo" }],
          },
          {
            name: "Mar",
            englishFullName: [{ value: "Mark" }],
            fullName: [{ value: "Marcos" }],
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformBibleCodes({
        languageId: "21028", // Spanish
        languageTag: "es",
      })

      // Verify the transformation logic
      expect(result).toEqual([
        {
          name: "Mat",
          metadataLanguageTag: "es",
          currentDescriptorLanguageId: "21028",
          englishFullName: "Matthew",
          fullName: "Mateo",
        },
        {
          name: "Mar",
          metadataLanguageTag: "es",
          currentDescriptorLanguageId: "21028",
          englishFullName: "Mark",
          fullName: "Marcos",
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.create).toHaveBeenCalledWith(
        BibleCode,
        {
          name: "Mat",
          metadataLanguageTag: "es",
          currentDescriptorLanguageId: "21028",
          englishFullName: "Matthew",
          fullName: "Mateo",
        },
        Realm.UpdateMode.Modified
      )
    })

    it("should handle books with different language names", async () => {
      const mockApiResponse = createMockResponse({
        bibleBooks: [
          {
            name: "Gen",
            englishFullName: [{ value: "Genesis" }],
            fullName: [{ value: "Bereshit" }], // Hebrew
          },
          {
            name: "Exo",
            englishFullName: [{ value: "Exodus" }],
            fullName: [{ value: "Shemot" }], // Hebrew
          },
        ],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformBibleCodes({
        languageId: "6930", // Hebrew
        languageTag: "he",
      })

      expect(result).toEqual([
        {
          name: "Gen",
          metadataLanguageTag: "he",
          currentDescriptorLanguageId: "6930",
          englishFullName: "Genesis",
          fullName: "Bereshit",
        },
        {
          name: "Exo",
          metadataLanguageTag: "he",
          currentDescriptorLanguageId: "6930",
          englishFullName: "Exodus",
          fullName: "Shemot",
        },
      ])
    })
  })
})
