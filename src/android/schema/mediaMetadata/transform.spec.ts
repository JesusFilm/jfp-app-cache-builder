import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mockReset } from "vitest-mock-extended"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_MediaMetadataQuery as query } from "./query.js"
import { transformMediaMetadata } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn(() => Promise.resolve(prisma)),
}))

const mockClient = vi.mocked(client)
const mockDb = vi.mocked(prisma)

describe("transformMediaMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReset(prisma)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful transformation", () => {
    it("should transform videos with metadata arrays into media metadata records", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            title: [
              {
                value: "English Title",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Spanish Title",
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
            longDescription: [
              {
                value: "English Description",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Spanish Description",
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
            shortDescription: [
              {
                value: "English Snippet",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Spanish Snippet",
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
            studyQuestions: [
              {
                value: "Question 1",
                order: 2,
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Question 2",
                order: 1,
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Pregunta 1",
                order: 1,
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaMetadata({
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

      // Verify database createMany was called for metadata records
      expect(mockDb.media_metadata.createMany).toHaveBeenCalledTimes(1)

      // Verify createMany was called with all metadata records
      expect(mockDb.media_metadata.createMany).toHaveBeenCalledWith({
        data: [
          {
            mediaId: "video1",
            title: "English Title",
            shortDescription: "English Snippet",
            longDescription: "English Description",
            studyQuestions: JSON.stringify(["Question 2", "Question 1"]),
            metadataLanguageTag: "en",
          },
          {
            mediaId: "video1",
            title: "Spanish Title",
            shortDescription: "Spanish Snippet",
            longDescription: "Spanish Description",
            studyQuestions: JSON.stringify(["Pregunta 1"]),
            metadataLanguageTag: "es",
          },
        ],
      })

      // Verify the transformed data
      expect(result).toEqual([
        {
          mediaId: "video1",
          title: "English Title",
          shortDescription: "English Snippet",
          longDescription: "English Description",
          studyQuestions: JSON.stringify(["Question 2", "Question 1"]),
          metadataLanguageTag: "en",
        },
        {
          mediaId: "video1",
          title: "Spanish Title",
          shortDescription: "Spanish Snippet",
          longDescription: "Spanish Description",
          studyQuestions: JSON.stringify(["Pregunta 1"]),
          metadataLanguageTag: "es",
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            title: [
              {
                value: "English Title",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            longDescription: [
              {
                value: "English Description",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            shortDescription: [
              {
                value: "English Snippet",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            studyQuestions: [],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaMetadata({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(mockDb.media_metadata.createMany).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          mediaId: "video1",
          title: "English Title",
          shortDescription: "English Snippet",
          longDescription: "English Description",
          studyQuestions: null,
          metadataLanguageTag: "en",
        },
      ])
    })

    it("should handle pagination correctly", async () => {
      // First page
      const mockVideosPage1 = [
        {
          id: "video1",
          title: [
            {
              value: "English Title 1",
              language: {
                metadataLanguageTag: "en",
              },
            },
          ],
          longDescription: [
            {
              value: "English Description 1",
              language: {
                metadataLanguageTag: "en",
              },
            },
          ],
          shortDescription: [
            {
              value: "English Snippet 1",
              language: {
                metadataLanguageTag: "en",
              },
            },
          ],
          studyQuestions: [],
        },
      ]

      // Second page
      const mockVideosPage2 = [
        {
          id: "video2",
          title: [
            {
              value: "English Title 2",
              language: {
                metadataLanguageTag: "en",
              },
            },
          ],
          longDescription: [
            {
              value: "English Description 2",
              language: {
                metadataLanguageTag: "en",
              },
            },
          ],
          shortDescription: [
            {
              value: "English Snippet 2",
              language: {
                metadataLanguageTag: "en",
              },
            },
          ],
          studyQuestions: [],
        },
      ]

      mockClient.query
        .mockResolvedValueOnce(createMockResponse({ videos: mockVideosPage1 }))
        .mockResolvedValueOnce(createMockResponse({ videos: mockVideosPage2 }))
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaMetadata({
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

      // Verify all metadata records were created
      expect(result).toHaveLength(2)
      expect(result[0]?.mediaId).toBe("video1")
      expect(result[1]?.mediaId).toBe("video2")

      // Verify all 2 metadata records were upserted
      expect(mockDb.media_metadata.createMany).toHaveBeenCalledTimes(2)
    })
  })

  describe("edge cases", () => {
    it("should handle empty videos array", async () => {
      const mockApiResponse = createMockResponse({
        videos: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformMediaMetadata({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.media_metadata.createMany).not.toHaveBeenCalled()
      expect(mockClient.query).toHaveBeenCalledTimes(1)
      expect(mockClient.query).toHaveBeenCalledWith({
        query,
        variables: { offset: 0, limit: 100 },
      })
    })

    it("should handle videos with missing metadata arrays", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            title: [],
            longDescription: [],
            shortDescription: [],
            studyQuestions: [],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaMetadata({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.media_metadata.createMany).not.toHaveBeenCalled()
    })

    it("should handle videos with missing language tags", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            title: [
              {
                value: "English Title",
                language: {
                  metadataLanguageTag: null,
                },
              },
            ],
            longDescription: [
              {
                value: "English Description",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            shortDescription: [
              {
                value: "English Snippet",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            studyQuestions: [],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaMetadata({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          mediaId: "video1",
          title: "",
          shortDescription: "English Snippet",
          longDescription: "English Description",
          studyQuestions: null,
          metadataLanguageTag: "en",
        },
      ])
    })

    it("should handle study questions with complex ordering", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            title: [
              {
                value: "English Title",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            longDescription: [
              {
                value: "English Description",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            shortDescription: [
              {
                value: "English Snippet",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            studyQuestions: [
              {
                value: "Question 3",
                order: 3,
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Question 1",
                order: 1,
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Question 2",
                order: 2,
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaMetadata({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          mediaId: "video1",
          title: "English Title",
          shortDescription: "English Snippet",
          longDescription: "English Description",
          studyQuestions: JSON.stringify([
            "Question 1",
            "Question 2",
            "Question 3",
          ]),
          metadataLanguageTag: "en",
        },
      ])
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformMediaMetadata({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.media_metadata.createMany).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            title: [
              {
                value: "English Title",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            longDescription: [
              {
                value: "English Description",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            shortDescription: [
              {
                value: "English Snippet",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            studyQuestions: [],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination
      ;(mockDb.media_metadata.createMany as any).mockRejectedValue(
        new Error("Database write failed")
      )

      await expect(
        transformMediaMetadata({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly match metadata by bcp47 language tags", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            title: [
              {
                value: "English Title",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Spanish Title",
                language: {
                  metadataLanguageTag: "es",
                },
              },
              {
                value: "French Title",
                language: {
                  metadataLanguageTag: "fr",
                },
              },
            ],
            longDescription: [
              {
                value: "English Description",
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Spanish Description",
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
            shortDescription: [
              {
                value: "English Snippet",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            studyQuestions: [
              {
                value: "English Question",
                order: 1,
                language: {
                  metadataLanguageTag: "en",
                },
              },
              {
                value: "Spanish Question",
                order: 1,
                language: {
                  metadataLanguageTag: "es",
                },
              },
            ],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaMetadata({
        languageId: "529",
        languageTag: "en",
      })

      // Should create 3 metadata records (en, es, fr)
      expect(result).toHaveLength(3)

      // Verify English metadata
      const englishMetadata = result.find((m) => m.metadataLanguageTag === "en")
      expect(englishMetadata).toEqual({
        mediaId: "video1",
        title: "English Title",
        shortDescription: "English Snippet",
        longDescription: "English Description",
        studyQuestions: JSON.stringify(["English Question"]),
        metadataLanguageTag: "en",
      })

      // Verify Spanish metadata
      const spanishMetadata = result.find((m) => m.metadataLanguageTag === "es")
      expect(spanishMetadata).toEqual({
        mediaId: "video1",
        title: "Spanish Title",
        shortDescription: "",
        longDescription: "Spanish Description",
        studyQuestions: JSON.stringify(["Spanish Question"]),
        metadataLanguageTag: "es",
      })

      // Verify French metadata (missing description and snippet)
      const frenchMetadata = result.find((m) => m.metadataLanguageTag === "fr")
      expect(frenchMetadata).toEqual({
        mediaId: "video1",
        title: "French Title",
        shortDescription: "",
        longDescription: "",
        studyQuestions: null,
        metadataLanguageTag: "fr",
      })

      // Verify all 3 metadata records were upserted
      expect(mockDb.media_metadata.createMany).toHaveBeenCalledTimes(1)
    })

    it("should handle multiple videos with overlapping language tags", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            title: [
              {
                value: "Video 1 English Title",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            longDescription: [
              {
                value: "Video 1 English Description",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            shortDescription: [
              {
                value: "Video 1 English Snippet",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            studyQuestions: [],
          },
          {
            id: "video2",
            title: [
              {
                value: "Video 2 English Title",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            longDescription: [
              {
                value: "Video 2 English Description",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            shortDescription: [
              {
                value: "Video 2 English Snippet",
                language: {
                  metadataLanguageTag: "en",
                },
              },
            ],
            studyQuestions: [],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] })) // Stop pagination

      const result = await transformMediaMetadata({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          mediaId: "video1",
          title: "Video 1 English Title",
          shortDescription: "Video 1 English Snippet",
          longDescription: "Video 1 English Description",
          studyQuestions: null,
          metadataLanguageTag: "en",
        },
        {
          mediaId: "video2",
          title: "Video 2 English Title",
          shortDescription: "Video 2 English Snippet",
          longDescription: "Video 2 English Description",
          studyQuestions: null,
          metadataLanguageTag: "en",
        },
      ])

      // Verify both metadata records were upserted
      expect(mockDb.media_metadata.createMany).toHaveBeenCalledTimes(1)
    })
  })
})
