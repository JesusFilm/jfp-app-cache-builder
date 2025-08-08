import { describe, it, expect, beforeEach, vi } from "vitest"

import { prisma } from "../../../__mocks__/prisma.js"
import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"

import { JFPAppCacheBuilder_Android_MediaDataQuery as query } from "./query.js"
import { transformMediaData } from "./transform.js"

import type { PrismaMock } from "../../../__mocks__/prisma.js"

vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn(() => Promise.resolve(prisma)),
}))

const mockClient = vi.mocked(client)

describe("transformMediaData", () => {
  let mockDb: PrismaMock

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = prisma
  })

  it("should transform media data successfully", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [
            { quality: "low", size: 1000000 },
            { quality: "high", size: 5000000 },
          ],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [
          {
            chapterStart: 1,
            chapterEnd: 1,
            osisBibleBook: "Gen",
            verseEnd: 10,
            verseStart: 1,
          },
        ],
        imageUrls: [
          {
            mobileCinematicHigh: "high.jpg",
            mobileCinematicLow: "low.jpg",
            thumbnail: "thumb.jpg",
          },
        ],
        children: [{ id: "child1" }],
        parents: [{ id: "parent1" }],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: "video1",
      componentType: 1,
      primaryMediaLanguageId: "lang1",
      primaryMediaLanguageName: "",
      subType: "movie",
      contentType: 2,
      lengthInMilliseconds: 120000,
      isDownloadable: 1,
      languageCount: 5,
      containsCount: 2,
      approximateDownloadLowFileSizeInBytes: 1000000,
      approximateDownloadHighFileSizeInBytes: 5000000,
      bibleCitations: JSON.stringify([
        {
          osisId: "Gen",
          chapterStart: 1,
          chapterEnd: 1,
          verseStart: 1,
          verseEnd: 10,
        },
      ]),
      mediaComponentLinks: JSON.stringify(["parent1", "child1"]),
      imageUrls: JSON.stringify({
        mobileCinematicHigh: "high.jpg",
        mobileCinematicLow: "low.jpg",
        thumbnail: "thumb.jpg",
      }),
    })

    expect(mockDb.media_data.create).toHaveBeenCalledWith({
      data: result[0],
    })
  })

  it("should cap download sizes to INT maximum value", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [
            { quality: "low", size: 1000000 },
            { quality: "high", size: 3000000000 }, // Exceeds INT max (2,147,483,647)
          ],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.approximateDownloadLowFileSizeInBytes).toBe(1000000)
    expect(result[0]?.approximateDownloadHighFileSizeInBytes).toBe(2147483647) // Capped to INT max
  })

  it("should handle undefined variant downloads correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: undefined,
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.approximateDownloadLowFileSizeInBytes).toBe(0)
    expect(result[0]?.approximateDownloadHighFileSizeInBytes).toBe(0)
  })

  it("should handle missing variant downloads correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          // downloads field is completely missing
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.approximateDownloadLowFileSizeInBytes).toBe(0)
    expect(result[0]?.approximateDownloadHighFileSizeInBytes).toBe(0)
  })

  it("should handle empty variant downloads correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.approximateDownloadLowFileSizeInBytes).toBe(0)
    expect(result[0]?.approximateDownloadHighFileSizeInBytes).toBe(0)
  })

  it("should handle variant downloads with null sizes correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [
            { quality: "low", size: null },
            { quality: "high", size: 5000000 },
            { quality: "medium", size: undefined },
          ],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.approximateDownloadLowFileSizeInBytes).toBe(5000000)
    expect(result[0]?.approximateDownloadHighFileSizeInBytes).toBe(5000000)
  })

  it("should handle undefined lengthInMilliseconds correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: undefined,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.lengthInMilliseconds).toBe(0)
  })

  it("should handle missing lengthInMilliseconds correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          isDownloadable: true,
          downloads: [],
          // lengthInMilliseconds field is completely missing
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.lengthInMilliseconds).toBe(0)
  })

  it("should handle null lengthInMilliseconds correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: null,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.lengthInMilliseconds).toBe(0)
  })

  it("should handle collection/series content types correctly", async () => {
    const mockVideos = [
      {
        id: "collection1",
        primaryMediaLanguageId: "lang1",
        subType: "collection",
        variant: {
          lengthInMilliseconds: 0,
          isDownloadable: false,
          downloads: [],
        },
        languageCount: 3,
        containsCount: 5,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
      {
        id: "series1",
        primaryMediaLanguageId: "lang1",
        subType: "series",
        variant: {
          lengthInMilliseconds: 0,
          isDownloadable: false,
          downloads: [],
        },
        languageCount: 2,
        containsCount: 3,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.contentType).toBe(1) // collection
    expect(result[0]?.componentType).toBe(2) // inverse of contentType
    expect(result[1]?.contentType).toBe(1) // series
    expect(result[1]?.componentType).toBe(2) // inverse of contentType
  })

  it("should handle empty mediaComponentLinks correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.mediaComponentLinks).toBeNull()
  })

  it("should handle undefined parents and children correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: undefined,
        parents: undefined,
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.mediaComponentLinks).toBeNull()
  })

  it("should handle missing parents and children correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        // children and parents are completely missing
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result[0]?.mediaComponentLinks).toBeNull()
  })

  it("should handle only parents correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [{ id: "parent1" }, { id: "parent2" }],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(JSON.parse(result[0]?.mediaComponentLinks || "[]")).toEqual([
      "parent1",
      "parent2",
    ])
  })

  it("should handle only children correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [{ id: "child1" }, { id: "child2" }],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(JSON.parse(result[0]?.mediaComponentLinks || "[]")).toEqual([
      "child1",
      "child2",
    ])
  })

  it("should process imageUrls correctly using reduce", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [
          {
            mobileCinematicHigh: "high1.jpg",
            mobileCinematicLow: "low1.jpg",
            mobileCinematicVeryLow: "verylow1.jpg",
            thumbnail: "thumb1.jpg",
            videoStill: "still1.jpg",
          },
          {
            mobileCinematicHigh: "high2.jpg", // Should not override high1.jpg
            mobileCinematicVeryLow: "verylow2.jpg", // Should not override verylow1.jpg
            videoStill: "still2.jpg", // Should not override still1.jpg
          },
        ],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    const expectedImageUrls = {
      mobileCinematicHigh: "high1.jpg", // From first object
      mobileCinematicLow: "low1.jpg", // From first object
      mobileCinematicVeryLow: "verylow1.jpg", // From first object
      thumbnail: "thumb1.jpg", // From first object
      videoStill: "still1.jpg", // From first object
    }

    expect(JSON.parse(result[0]?.imageUrls || "{}")).toEqual(expectedImageUrls)
  })

  it("should handle empty imageUrls correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [], // Empty array
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(JSON.parse(result[0]?.imageUrls || "{}")).toEqual({})
  })

  it("should handle undefined imageUrls correctly", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: undefined, // Undefined
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(JSON.parse(result[0]?.imageUrls || "{}")).toEqual({})
  })

  it("should handle pagination correctly", async () => {
    // Create smaller test data to avoid memory issues
    const mockVideosPage1 = Array.from({ length: 3 }, (_, i) => ({
      id: `video${i}`,
      primaryMediaLanguageId: "lang1",
      subType: "movie",
      variant: {
        lengthInMilliseconds: 120000,
        isDownloadable: true,
        downloads: [],
      },
      languageCount: 5,
      containsCount: 2,
      bibleCitations: [],
      imageUrls: [],
      children: [],
      parents: [],
    }))

    const mockVideosPage2 = Array.from({ length: 2 }, (_, i) => ({
      id: `video${i + 3}`,
      primaryMediaLanguageId: "lang1",
      subType: "movie",
      variant: {
        lengthInMilliseconds: 120000,
        isDownloadable: true,
        downloads: [],
      },
      languageCount: 5,
      containsCount: 2,
      bibleCitations: [],
      imageUrls: [],
      children: [],
      parents: [],
    }))

    mockClient.query
      .mockResolvedValueOnce(createMockResponse({ videos: mockVideosPage1 }))
      .mockResolvedValueOnce(createMockResponse({ videos: mockVideosPage2 }))
      .mockResolvedValueOnce(createMockResponse({ videos: [] })) // This stops the pagination loop

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
    })

    expect(result).toHaveLength(5) // 3 + 2
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
  })

  it("should handle read-only mode", async () => {
    const mockVideos = [
      {
        id: "video1",
        primaryMediaLanguageId: "lang1",
        subType: "movie",
        variant: {
          lengthInMilliseconds: 120000,
          isDownloadable: true,
          downloads: [],
        },
        languageCount: 5,
        containsCount: 2,
        bibleCitations: [],
        imageUrls: [],
        children: [],
        parents: [],
      },
    ]

    const mockResponse = createMockResponse({
      videos: mockVideos,
    })

    mockClient.query
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(createMockResponse({ videos: [] }))

    const result = await transformMediaData({
      languageId: "529",
      languageTag: "en",
      readOnly: true,
    })

    expect(result).toHaveLength(1)
    expect(mockDb.media_data.create).not.toHaveBeenCalled()
  })

  it("should handle errors gracefully", async () => {
    mockClient.query.mockRejectedValue(new Error("API Error"))

    await expect(
      transformMediaData({
        languageId: "529",
        languageTag: "en",
      })
    ).rejects.toThrow("API Error")
  })
})
