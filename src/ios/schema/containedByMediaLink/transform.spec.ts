import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"
import { getDb } from "../../lib/db.js"

import { ContainedByMediaLink } from "./realm.js"
import { transformContainedByMediaLinks } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js")

const mockClient = vi.mocked(client)
const mockGetDb = vi.mocked(getDb)

describe("transformContainedByMediaLinks", () => {
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
    it("should transform contained by media links and write to database", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        videos: [
          {
            parentMediaComponentId: "video1",
            children: [
              { mediaComponentId: "child1" },
              { mediaComponentId: "child2" },
            ],
          },
          {
            parentMediaComponentId: "video2",
            children: [{ mediaComponentId: "child3" }],
          },
        ],
      })

      // Mock MediaItem lookups
      const mockMediaItem1 = { id: "child1", title: "Child 1" } as any
      const mockMediaItem2 = { id: "child2", title: "Child 2" } as any
      const mockMediaItem3 = { id: "child3", title: "Child 3" } as any

      mockDb.objectForPrimaryKey.mockImplementation(
        (_: any, mediaComponentId: any) => {
          if (typeof mediaComponentId !== "string") return null

          switch (mediaComponentId) {
            case "child1":
              return mockMediaItem1
            case "child2":
              return mockMediaItem2
            case "child3":
              return mockMediaItem3
            default:
              return null
          }
        }
      )

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformContainedByMediaLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
      })

      // Verify getDb was called
      expect(mockGetDb).toHaveBeenCalled()

      // Verify database write was called
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).toHaveBeenCalledTimes(3)

      // Verify the transformed data
      expect(result).toEqual([
        {
          parentSortLink: "video1__0__arclightContainedBy",
          mediaComponentId: "child1",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video1",
          sortOrder: 0,
          mediaItem: mockMediaItem1,
        },
        {
          parentSortLink: "video1__1__arclightContainedBy",
          mediaComponentId: "child2",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video1",
          sortOrder: 1,
          mediaItem: mockMediaItem2,
        },
        {
          parentSortLink: "video2__0__arclightContainedBy",
          mediaComponentId: "child3",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video2",
          sortOrder: 0,
          mediaItem: mockMediaItem3,
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            parentMediaComponentId: "video1",
            children: [{ mediaComponentId: "child1" }],
          },
        ],
      })

      const mockMediaItem = { id: "child1", title: "Child 1" } as any
      mockDb.objectForPrimaryKey.mockImplementation(
        (_: any, mediaComponentId: any) => {
          if (typeof mediaComponentId !== "string") return null
          if (mediaComponentId === "child1") {
            return mockMediaItem
          }
          return null
        }
      )
      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformContainedByMediaLinks({
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
          parentSortLink: "video1__0__arclightContainedBy",
          mediaComponentId: "child1",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video1",
          sortOrder: 0,
          mediaItem: mockMediaItem,
        },
      ])
    })
  })

  describe("edge cases", () => {
    it("should handle empty videos array", async () => {
      const mockApiResponse = createMockResponse({
        videos: [],
      })

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformContainedByMediaLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockGetDb).toHaveBeenCalled()
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle videos with no children", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            parentMediaComponentId: "video1",
            children: [],
          },
          {
            parentMediaComponentId: "video2",
            children: [{ mediaComponentId: "child1" }],
          },
        ],
      })

      const mockMediaItem = { id: "child1", title: "Child 1" } as any
      mockDb.objectForPrimaryKey.mockImplementation(
        (_: any, mediaComponentId: any) => {
          if (typeof mediaComponentId !== "string") return null
          if (mediaComponentId === "child1") return mockMediaItem
          return null
        }
      )
      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformContainedByMediaLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Should only create links for video2 which has children
      expect(result).toEqual([
        {
          parentSortLink: "video2__0__arclightContainedBy",
          mediaComponentId: "child1",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video2",
          sortOrder: 0,
          mediaItem: mockMediaItem,
        },
      ])
      expect(mockDb.create).toHaveBeenCalledTimes(1)
    })

    it("should handle missing MediaItems", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            parentMediaComponentId: "video1",
            children: [
              { mediaComponentId: "child1" },
              { mediaComponentId: "child2" },
              { mediaComponentId: "child3" },
            ],
          },
        ],
      })

      // Mock MediaItem lookups - child2 doesn't exist
      const mockMediaItem1 = { id: "child1", title: "Child 1" } as any
      const mockMediaItem3 = { id: "child3", title: "Child 3" } as any

      mockDb.objectForPrimaryKey.mockImplementation(
        (_: any, mediaComponentId: any) => {
          if (typeof mediaComponentId !== "string") return null

          switch (mediaComponentId) {
            case "child1":
              return mockMediaItem1
            case "child2":
              return null // child2 doesn't exist
            case "child3":
              return mockMediaItem3
            default:
              return null
          }
        }
      )

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformContainedByMediaLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Should only create links for child1 and child3 (child2 filtered out)
      expect(result).toEqual([
        {
          parentSortLink: "video1__0__arclightContainedBy",
          mediaComponentId: "child1",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video1",
          sortOrder: 0,
          mediaItem: mockMediaItem1,
        },
        {
          parentSortLink: "video1__2__arclightContainedBy",
          mediaComponentId: "child3",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video1",
          sortOrder: 2,
          mediaItem: mockMediaItem3,
        },
      ])
      expect(mockDb.create).toHaveBeenCalledTimes(2)
    })

    it("should handle mixed scenarios", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            parentMediaComponentId: "video1",
            children: [], // No children
          },
          {
            parentMediaComponentId: "video2",
            children: [
              { mediaComponentId: "child1" },
              { mediaComponentId: "child2" },
            ],
          },
          {
            parentMediaComponentId: "video3",
            children: [{ mediaComponentId: "child3" }],
          },
        ],
      })

      // Mock MediaItem lookups - child2 doesn't exist
      const mockMediaItem1 = { id: "child1", title: "Child 1" } as any
      const mockMediaItem3 = { id: "child3", title: "Child 3" } as any

      mockDb.objectForPrimaryKey.mockImplementation(
        (_: any, mediaComponentId: any) => {
          if (typeof mediaComponentId !== "string") return null

          switch (mediaComponentId) {
            case "child1":
              return mockMediaItem1
            case "child2":
              return null // child2 doesn't exist
            case "child3":
              return mockMediaItem3
            default:
              return null
          }
        }
      )

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformContainedByMediaLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Should create links for child1 and child3, skip video1 (no children) and child2 (no MediaItem)
      expect(result).toEqual([
        {
          parentSortLink: "video2__0__arclightContainedBy",
          mediaComponentId: "child1",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video2",
          sortOrder: 0,
          mediaItem: mockMediaItem1,
        },
        {
          parentSortLink: "video3__0__arclightContainedBy",
          mediaComponentId: "child3",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "video3",
          sortOrder: 0,
          mediaItem: mockMediaItem3,
        },
      ])
      expect(mockDb.create).toHaveBeenCalledTimes(2)
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformContainedByMediaLinks({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("GraphQL query failed")

      expect(mockDb.write).not.toHaveBeenCalled()
    })

    it("should handle database write errors", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            parentMediaComponentId: "video1",
            children: [{ mediaComponentId: "child1" }],
          },
        ],
      })

      const mockMediaItem = { id: "child1", title: "Child 1" } as any
      mockDb.objectForPrimaryKey.mockImplementation(
        (_: any, mediaComponentId: any) => {
          if (typeof mediaComponentId !== "string") return null
          if (mediaComponentId === "child1") return mockMediaItem
          return null
        }
      )
      mockClient.query.mockResolvedValue(mockApiResponse)
      mockDb.write.mockImplementation(() => {
        throw new Error("Database write failed")
      })

      await expect(
        transformContainedByMediaLinks({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly transform data structure", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            parentMediaComponentId: "collection123",
            children: [
              { mediaComponentId: "episode1" },
              { mediaComponentId: "episode2" },
              { mediaComponentId: "episode3" },
            ],
          },
        ],
      })

      const mockMediaItems = [
        { id: "episode1", title: "Episode 1" },
        { id: "episode2", title: "Episode 2" },
        { id: "episode3", title: "Episode 3" },
      ] as any[]

      mockDb.objectForPrimaryKey.mockImplementation(
        (_: any, mediaComponentId: any) => {
          if (typeof mediaComponentId !== "string") return null

          switch (mediaComponentId) {
            case "episode1":
              return mockMediaItems[0]
            case "episode2":
              return mockMediaItems[1]
            case "episode3":
              return mockMediaItems[2]
            default:
              return null
          }
        }
      )

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformContainedByMediaLinks({
        languageId: "529",
        languageTag: "en",
      })

      // Verify the transformation logic
      expect(result).toEqual([
        {
          parentSortLink: "collection123__0__arclightContainedBy",
          mediaComponentId: "episode1",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "collection123",
          sortOrder: 0,
          mediaItem: mockMediaItems[0],
        },
        {
          parentSortLink: "collection123__1__arclightContainedBy",
          mediaComponentId: "episode2",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "collection123",
          sortOrder: 1,
          mediaItem: mockMediaItems[1],
        },
        {
          parentSortLink: "collection123__2__arclightContainedBy",
          mediaComponentId: "episode3",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "collection123",
          sortOrder: 2,
          mediaItem: mockMediaItems[2],
        },
      ])

      // Verify database objects are created with correct structure
      expect(mockDb.create).toHaveBeenCalledWith(
        ContainedByMediaLink,
        {
          parentSortLink: "collection123__0__arclightContainedBy",
          mediaComponentId: "episode1",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "collection123",
          sortOrder: 0,
          mediaItem: mockMediaItems[0],
        },
        Realm.UpdateMode.Modified
      )
    })

    it("should handle multiple videos with different child counts", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            parentMediaComponentId: "series1",
            children: [
              { mediaComponentId: "episode1" },
              { mediaComponentId: "episode2" },
            ],
          },
          {
            parentMediaComponentId: "series2",
            children: [
              { mediaComponentId: "episode3" },
              { mediaComponentId: "episode4" },
              { mediaComponentId: "episode5" },
            ],
          },
        ],
      })

      const mockMediaItems = [
        { id: "episode1", title: "Episode 1" },
        { id: "episode2", title: "Episode 2" },
        { id: "episode3", title: "Episode 3" },
        { id: "episode4", title: "Episode 4" },
        { id: "episode5", title: "Episode 5" },
      ] as any[]

      mockDb.objectForPrimaryKey.mockImplementation(
        (_: any, mediaComponentId: any) => {
          if (typeof mediaComponentId !== "string") return null

          switch (mediaComponentId) {
            case "episode1":
              return mockMediaItems[0]
            case "episode2":
              return mockMediaItems[1]
            case "episode3":
              return mockMediaItems[2]
            case "episode4":
              return mockMediaItems[3]
            case "episode5":
              return mockMediaItems[4]
            default:
              return null
          }
        }
      )

      mockClient.query.mockResolvedValue(mockApiResponse)

      const result = await transformContainedByMediaLinks({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          parentSortLink: "series1__0__arclightContainedBy",
          mediaComponentId: "episode1",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "series1",
          sortOrder: 0,
          mediaItem: mockMediaItems[0],
        },
        {
          parentSortLink: "series1__1__arclightContainedBy",
          mediaComponentId: "episode2",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "series1",
          sortOrder: 1,
          mediaItem: mockMediaItems[1],
        },
        {
          parentSortLink: "series2__0__arclightContainedBy",
          mediaComponentId: "episode3",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "series2",
          sortOrder: 0,
          mediaItem: mockMediaItems[2],
        },
        {
          parentSortLink: "series2__1__arclightContainedBy",
          mediaComponentId: "episode4",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "series2",
          sortOrder: 1,
          mediaItem: mockMediaItems[3],
        },
        {
          parentSortLink: "series2__2__arclightContainedBy",
          mediaComponentId: "episode5",
          linkType: "arclightContainedBy",
          parentMediaComponentId: "series2",
          sortOrder: 2,
          mediaItem: mockMediaItems[4],
        },
      ])
    })
  })
})
