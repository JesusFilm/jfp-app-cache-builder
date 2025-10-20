import Realm from "realm"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { getDb } from "../../lib/db.js"

import { MediaCategory } from "./realm.js"
import { transformMediaCategories } from "./transform.js"

// Mock the dependencies
vi.mock("../../lib/db.js")

const mockGetDb = vi.mocked(getDb)

describe("transformMediaCategories", () => {
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

  it("should transform media categories and write to database", async () => {
    const result = await transformMediaCategories({
      languageId: "529",
      languageTag: "en",
    })

    // Verify getDb was called
    expect(mockGetDb).toHaveBeenCalled()

    // Verify database write was called
    expect(mockDb.write).toHaveBeenCalled()
    expect(mockDb.create).toHaveBeenCalledTimes(8)

    // Verify the transformed data
    expect(result).toEqual([
      {
        name: "collection",
        category_description: "Collection",
      },
      {
        name: "episode",
        category_description: "Episode",
      },
      {
        name: "featureFilm",
        category_description: "Feature Film",
      },
      {
        name: "segment",
        category_description: "Segment",
      },
      {
        name: "series",
        category_description: "Series",
      },
      {
        name: "shortFilm",
        category_description: "Short Film",
      },
      {
        name: "trailer",
        category_description: "Trailer",
      },
      {
        name: "behindTheScenes",
        category_description: "Behind The Scenes",
      },
    ])

    // Verify database objects are created with correct structure
    expect(mockDb.create).toHaveBeenCalledWith(
      MediaCategory,
      {
        name: "collection",
        category_description: "Collection",
      },
      Realm.UpdateMode.Modified
    )

    expect(mockDb.create).toHaveBeenCalledWith(
      MediaCategory,
      {
        name: "featureFilm",
        category_description: "Feature Film",
      },
      Realm.UpdateMode.Modified
    )

    expect(mockDb.create).toHaveBeenCalledWith(
      MediaCategory,
      {
        name: "behindTheScenes",
        category_description: "Behind The Scenes",
      },
      Realm.UpdateMode.Modified
    )
  })

  it("should work in read-only mode", async () => {
    const result = await transformMediaCategories({
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
        name: "collection",
        category_description: "Collection",
      },
      {
        name: "episode",
        category_description: "Episode",
      },
      {
        name: "featureFilm",
        category_description: "Feature Film",
      },
      {
        name: "segment",
        category_description: "Segment",
      },
      {
        name: "series",
        category_description: "Series",
      },
      {
        name: "shortFilm",
        category_description: "Short Film",
      },
      {
        name: "trailer",
        category_description: "Trailer",
      },
      {
        name: "behindTheScenes",
        category_description: "Behind The Scenes",
      },
    ])
  })
})
