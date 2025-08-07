import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { runner } from "./runner.js"

// Mock all the transformer functions
vi.mock("./schema/bibleCode/transform.js")
vi.mock("./schema/containedByMediaLink/transform.js")
vi.mock("./schema/country/transform.js")
vi.mock("./schema/countryLink/transform.js")
vi.mock("./schema/language/transform.js")
vi.mock("./schema/mediaCategory/transform.js")
vi.mock("./schema/mediaItem/transform.js")
vi.mock("./schema/readingLanguageData/transform.js")
vi.mock("./schema/suggestedLanguage/transform.js")

// Mock the database
vi.mock("./lib/db.js")

const { getDb, cleanup } = await import("./lib/db.js")

describe("runner", () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock the database
    const mockDb = {
      write: vi.fn(),
      create: vi.fn(),
      objects: vi.fn(),
      delete: vi.fn(),
    }
    vi.mocked(getDb).mockResolvedValue(mockDb as any)
    vi.mocked(cleanup).mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful execution", () => {
    it("should run all transformers except readingLanguageData by default", async () => {
      const { transformBibleCodes } = await import(
        "./schema/bibleCode/transform.js"
      )
      const { transformCountryLinks } = await import(
        "./schema/countryLink/transform.js"
      )
      const { transformLanguages } = await import(
        "./schema/language/transform.js"
      )
      const { transformSuggestedLanguages } = await import(
        "./schema/suggestedLanguage/transform.js"
      )
      const { transformCountries } = await import(
        "./schema/country/transform.js"
      )
      const { transformMediaCategories } = await import(
        "./schema/mediaCategory/transform.js"
      )
      const { transformMediaItems } = await import(
        "./schema/mediaItem/transform.js"
      )
      const { transformContainedByMediaLinks } = await import(
        "./schema/containedByMediaLink/transform.js"
      )
      const { transformReadingLanguageData } = await import(
        "./schema/readingLanguageData/transform.js"
      )

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformCountryLinks).mockResolvedValue([])
      vi.mocked(transformLanguages).mockResolvedValue([])
      vi.mocked(transformSuggestedLanguages).mockResolvedValue([])
      vi.mocked(transformCountries).mockResolvedValue([])
      vi.mocked(transformMediaCategories).mockResolvedValue([])
      vi.mocked(transformMediaItems).mockResolvedValue([])
      vi.mocked(transformContainedByMediaLinks).mockResolvedValue([])
      vi.mocked(transformReadingLanguageData).mockResolvedValue([])

      await runner({
        languageId: "529",
        languageTag: "en",
      })

      // Verify all transformers are called except readingLanguageData
      expect(transformBibleCodes).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
      })
      expect(transformCountryLinks).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
      })
      expect(transformLanguages).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
      })
      expect(transformSuggestedLanguages).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
      })
      expect(transformCountries).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
      })
      expect(transformMediaCategories).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
      })
      expect(transformMediaItems).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
      })
      expect(transformContainedByMediaLinks).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
      })

      // Should NOT call readingLanguageData transformer
      expect(transformReadingLanguageData).not.toHaveBeenCalled()
    })

    it("should run all transformers including readingLanguageData when enabled", async () => {
      const { transformBibleCodes } = await import(
        "./schema/bibleCode/transform.js"
      )
      const { transformReadingLanguageData } = await import(
        "./schema/readingLanguageData/transform.js"
      )

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformReadingLanguageData).mockResolvedValue([])

      await runner({
        languageId: "21028",
        languageTag: "es",
        includeReadingLanguageData: true,
      })

      // Verify readingLanguageData transformer is called
      expect(transformReadingLanguageData).toHaveBeenCalledWith({
        languageId: "21028",
        languageTag: "es",
      })
    })

    it("should work without logger", async () => {
      const { transformBibleCodes } = await import(
        "./schema/bibleCode/transform.js"
      )
      vi.mocked(transformBibleCodes).mockResolvedValue([])

      await runner({
        languageId: "496",
        languageTag: "fr",
      })

      expect(transformBibleCodes).toHaveBeenCalledWith({
        languageId: "496",
        languageTag: "fr",
      })
    })

    it("should pass readOnly parameter when set to true", async () => {
      const { transformBibleCodes } = await import(
        "./schema/bibleCode/transform.js"
      )
      const { transformLanguages } = await import(
        "./schema/language/transform.js"
      )
      const { transformCountries } = await import(
        "./schema/country/transform.js"
      )

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformLanguages).mockResolvedValue([])
      vi.mocked(transformCountries).mockResolvedValue([])

      await runner({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      // Verify transformers are called with readOnly: true
      expect(transformBibleCodes).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })
      expect(transformLanguages).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })
      expect(transformCountries).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })
    })
  })

  describe("error handling", () => {
    it("should propagate transformer errors", async () => {
      const { transformBibleCodes } = await import(
        "./schema/bibleCode/transform.js"
      )
      const error = new Error("Bible codes transform failed")
      vi.mocked(transformBibleCodes).mockRejectedValue(error)

      await expect(
        runner({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Bible codes transform failed")
    })

    it("should handle errors from later transformers", async () => {
      const { transformBibleCodes } = await import(
        "./schema/bibleCode/transform.js"
      )
      const { transformMediaItems } = await import(
        "./schema/mediaItem/transform.js"
      )

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformMediaItems).mockRejectedValue(
        new Error("Media items transform failed")
      )

      await expect(
        runner({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Media items transform failed")

      // Verify earlier transformers were called
      expect(transformBibleCodes).toHaveBeenCalled()
    })

    it("should handle readingLanguageData transformer errors", async () => {
      const { transformReadingLanguageData } = await import(
        "./schema/readingLanguageData/transform.js"
      )
      vi.mocked(transformReadingLanguageData).mockRejectedValue(
        new Error("Reading language data failed")
      )

      await expect(
        runner({
          languageId: "529",
          languageTag: "en",
          includeReadingLanguageData: true,
        })
      ).rejects.toThrow("Reading language data failed")
    })
  })

  describe("transformer execution order", () => {
    it("should execute transformers in the correct order", async () => {
      const executionOrder: string[] = []

      const { transformBibleCodes } = await import(
        "./schema/bibleCode/transform.js"
      )
      const { transformCountryLinks } = await import(
        "./schema/countryLink/transform.js"
      )
      const { transformLanguages } = await import(
        "./schema/language/transform.js"
      )
      const { transformSuggestedLanguages } = await import(
        "./schema/suggestedLanguage/transform.js"
      )
      const { transformCountries } = await import(
        "./schema/country/transform.js"
      )

      vi.mocked(transformBibleCodes).mockImplementation(async () => {
        executionOrder.push("bibleCodes")
        return []
      })
      vi.mocked(transformCountryLinks).mockImplementation(async () => {
        executionOrder.push("countryLinks")
        return []
      })
      vi.mocked(transformLanguages).mockImplementation(async () => {
        executionOrder.push("languages")
        return []
      })
      vi.mocked(transformSuggestedLanguages).mockImplementation(async () => {
        executionOrder.push("suggestedLanguages")
        return []
      })
      vi.mocked(transformCountries).mockImplementation(async () => {
        executionOrder.push("countries")
        return []
      })

      await runner({
        languageId: "529",
        languageTag: "en",
      })

      // Verify the first few transformers execute in order
      expect(executionOrder.slice(0, 5)).toEqual([
        "bibleCodes",
        "countryLinks",
        "languages",
        "suggestedLanguages",
        "countries",
      ])
    })
  })

  describe("parameter validation", () => {
    it("should pass correct parameters to all transformers", async () => {
      const { transformBibleCodes } = await import(
        "./schema/bibleCode/transform.js"
      )
      const { transformLanguages } = await import(
        "./schema/language/transform.js"
      )

      vi.mocked(transformBibleCodes).mockResolvedValue([])
      vi.mocked(transformLanguages).mockResolvedValue([])

      const mockLogger = {
        info: vi.fn(),
        child: vi.fn().mockReturnValue({
          info: vi.fn(),
        }),
      } as any

      await runner({
        languageId: "21028",
        languageTag: "es",
        logger: mockLogger,
      })

      expect(transformBibleCodes).toHaveBeenCalledWith({
        languageId: "21028",
        languageTag: "es",

        logger: expect.any(Object),
      })

      expect(transformLanguages).toHaveBeenCalledWith({
        languageId: "21028",
        languageTag: "es",

        logger: expect.any(Object),
      })

      // Verify logger.child was called for each transformer
      expect(mockLogger.child).toHaveBeenCalledWith({
        transformer: "bibleCodes",
        languageId: "21028",
        languageTag: "es",
      })
      expect(mockLogger.child).toHaveBeenCalledWith({
        transformer: "languages",
        languageId: "21028",
        languageTag: "es",
      })
    })
  })
})
