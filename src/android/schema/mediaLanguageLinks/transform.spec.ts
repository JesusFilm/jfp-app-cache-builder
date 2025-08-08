import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_MediaLanguageLinksQuery as query } from "./query.js"
import { transformMediaLanguageLinks } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn(() => Promise.resolve(prisma)),
}))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformMediaLanguageLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform videos and their language IDs into media language links", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageIds: [{ id: "lang1" }, { id: "lang2" }],
          },
          {
            id: "video2",
            languageIds: [{ id: "lang1" }, { id: "lang3" }],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaLanguageLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledTimes(2)
      expect(mockClient.query).toHaveBeenNthCalledWith(1, {
        query,
        variables: { offset: 0, limit: 100 },
      })
      expect(mockClient.query).toHaveBeenNthCalledWith(2, {
        query,
        variables: { offset: 100, limit: 100 },
      })

      // Verify database create was called for each media language link
      expect(mockDb.media_language_links.create).toHaveBeenCalledTimes(4)

      // Verify the first video's language links
      expect(mockDb.media_language_links.create).toHaveBeenCalledWith({
        data: {
          mediaComponentId: "video1",
          languageId: "lang1",
        },
      })
      expect(mockDb.media_language_links.create).toHaveBeenCalledWith({
        data: {
          mediaComponentId: "video1",
          languageId: "lang2",
        },
      })

      // Verify the second video's language links
      expect(mockDb.media_language_links.create).toHaveBeenCalledWith({
        data: {
          mediaComponentId: "video2",
          languageId: "lang1",
        },
      })
      expect(mockDb.media_language_links.create).toHaveBeenCalledWith({
        data: {
          mediaComponentId: "video2",
          languageId: "lang3",
        },
      })

      // Verify the transformed data
      expect(result).toEqual([
        {
          mediaComponentId: "video1",
          languageId: "lang1",
        },
        {
          mediaComponentId: "video1",
          languageId: "lang2",
        },
        {
          mediaComponentId: "video2",
          languageId: "lang1",
        },
        {
          mediaComponentId: "video2",
          languageId: "lang3",
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageIds: [{ id: "lang1" }],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaLanguageLinks({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(mockDb.media_language_links.create).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          mediaComponentId: "video1",
          languageId: "lang1",
        },
      ])
    })

    it("should handle pagination correctly", async () => {
      // First page
      const mockVideosPage1 = [
        {
          id: "video1",
          languageIds: [{ id: "lang1" }, { id: "lang2" }],
        },
        {
          id: "video2",
          languageIds: [{ id: "lang1" }],
        },
      ]

      // Second page
      const mockVideosPage2 = [
        {
          id: "video3",
          languageIds: [{ id: "lang2" }, { id: "lang3" }],
        },
      ]

      mockClient.query
        .mockResolvedValueOnce(createMockResponse({ videos: mockVideosPage1 }))
        .mockResolvedValueOnce(createMockResponse({ videos: mockVideosPage2 }))
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaLanguageLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called three times with correct pagination
      expect(mockClient.query).toHaveBeenCalledTimes(3)
      expect(mockClient.query).toHaveBeenNthCalledWith(1, {
        query,
        variables: { offset: 0, limit: 100 },
      })
      expect(mockClient.query).toHaveBeenNthCalledWith(2, {
        query,
        variables: { offset: 100, limit: 100 },
      })
      expect(mockClient.query).toHaveBeenNthCalledWith(3, {
        query,
        variables: { offset: 200, limit: 100 },
      })

      // Verify all media language links were created
      expect(result).toHaveLength(5) // 2 + 1 + 2 = 5 total links
      expect(result).toEqual([
        {
          mediaComponentId: "video1",
          languageId: "lang1",
        },
        {
          mediaComponentId: "video1",
          languageId: "lang2",
        },
        {
          mediaComponentId: "video2",
          languageId: "lang1",
        },
        {
          mediaComponentId: "video3",
          languageId: "lang2",
        },
        {
          mediaComponentId: "video3",
          languageId: "lang3",
        },
      ])

      // Verify all 5 media language links were created
      expect(mockDb.media_language_links.create).toHaveBeenCalledTimes(5)
    })
  })

  describe("edge cases", () => {
    it("should handle empty videos array", async () => {
      const mockApiResponse = createMockResponse({
        videos: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaLanguageLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.media_language_links.create).not.toHaveBeenCalled()
      expect(mockClient.query).toHaveBeenCalledTimes(1)
      expect(mockClient.query).toHaveBeenCalledWith({
        query,
        variables: { offset: 0, limit: 100 },
      })
    })

    it("should handle videos with no language IDs", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageIds: [],
          },
          {
            id: "video2",
            languageIds: [{ id: "lang1" }],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaLanguageLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          mediaComponentId: "video2",
          languageId: "lang1",
        },
      ])

      // Only the video with language IDs should be created
      expect(mockDb.media_language_links.create).toHaveBeenCalledTimes(1)
      expect(mockDb.media_language_links.create).toHaveBeenCalledWith({
        data: {
          mediaComponentId: "video2",
          languageId: "lang1",
        },
      })
    })

    it("should handle single video with multiple language IDs", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageIds: [{ id: "lang1" }, { id: "lang2" }, { id: "lang3" }],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaLanguageLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          mediaComponentId: "video1",
          languageId: "lang1",
        },
        {
          mediaComponentId: "video1",
          languageId: "lang2",
        },
        {
          mediaComponentId: "video1",
          languageId: "lang3",
        },
      ])

      expect(mockDb.media_language_links.create).toHaveBeenCalledTimes(3)
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformMediaLanguageLinks({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.media_language_links.create).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageIds: [{ id: "lang1" }],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination
      ;(mockDb.media_language_links.create as any).mockRejectedValue(
        new Error("Database write failed")
      )

      await expect(
        transformMediaLanguageLinks({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly transform video data structure", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "test-video-123",
            languageIds: [{ id: "english-001" }, { id: "spanish-002" }],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaLanguageLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Verify the transformation logic
      expect(result).toEqual([
        {
          mediaComponentId: "test-video-123",
          languageId: "english-001",
        },
        {
          mediaComponentId: "test-video-123",
          languageId: "spanish-002",
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.media_language_links.create).toHaveBeenCalledWith({
        data: {
          mediaComponentId: "test-video-123",
          languageId: "english-001",
        },
      })
    })

    it("should handle multiple videos with overlapping language IDs", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageIds: [{ id: "lang1" }, { id: "lang2" }],
          },
          {
            id: "video2",
            languageIds: [
              { id: "lang1" }, // Overlapping language ID
              { id: "lang3" },
            ],
          },
          {
            id: "video3",
            languageIds: [
              { id: "lang2" }, // Overlapping language ID
              { id: "lang4" },
            ],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaLanguageLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          mediaComponentId: "video1",
          languageId: "lang1",
        },
        {
          mediaComponentId: "video1",
          languageId: "lang2",
        },
        {
          mediaComponentId: "video2",
          languageId: "lang1",
        },
        {
          mediaComponentId: "video2",
          languageId: "lang3",
        },
        {
          mediaComponentId: "video3",
          languageId: "lang2",
        },
        {
          mediaComponentId: "video3",
          languageId: "lang4",
        },
      ])

      // Verify all 6 media language links were created
      expect(mockDb.media_language_links.create).toHaveBeenCalledTimes(6)
    })
  })
})
