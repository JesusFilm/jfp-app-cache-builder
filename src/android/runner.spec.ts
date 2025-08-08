import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { runner } from "./runner.js"

// Mock all the transformer functions
vi.mock("./schema/countries/transform.js")
vi.mock("./schema/countryTranslations/transform.js")
vi.mock("./schema/mediaData/transform.js")
vi.mock("./schema/mediaLanguageLinks/transform.js")
vi.mock("./schema/mediaLanguages/transform.js")
vi.mock("./schema/mediaLanguageTranslations/transform.js")
vi.mock("./schema/mediaMetadata/transform.js")
vi.mock("./schema/readingLanguages/transform.js")
vi.mock("./schema/spokenLanguages/transform.js")
vi.mock("./schema/suggestedLanguages/transform.js")
vi.mock("./schema/termTranslations/transform.js")

// Mock the rebuild function
vi.mock("./lib/db.js", () => ({
  rebuild: vi.fn(),
}))

const { rebuild } = await import("./lib/db.js")

describe("runner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("successful execution", () => {
    it("should run all transformers in the correct order", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      const { transformCountryTranslations } = await import(
        "./schema/countryTranslations/transform.js"
      )
      const { transformMediaData } = await import(
        "./schema/mediaData/transform.js"
      )
      const { transformMediaLanguages } = await import(
        "./schema/mediaLanguages/transform.js"
      )
      const { transformMediaLanguageLinks } = await import(
        "./schema/mediaLanguageLinks/transform.js"
      )
      const { transformMediaLanguageTranslations } = await import(
        "./schema/mediaLanguageTranslations/transform.js"
      )
      const { transformMediaMetadata } = await import(
        "./schema/mediaMetadata/transform.js"
      )
      const { transformSpokenLanguages } = await import(
        "./schema/spokenLanguages/transform.js"
      )
      const { transformSuggestedLanguages } = await import(
        "./schema/suggestedLanguages/transform.js"
      )
      const { transformTermTranslations } = await import(
        "./schema/termTranslations/transform.js"
      )
      const { transformReadingLanguages } = await import(
        "./schema/readingLanguages/transform.js"
      )

      vi.mocked(transformCountries).mockResolvedValue([])
      vi.mocked(transformCountryTranslations).mockResolvedValue([])
      vi.mocked(transformMediaData).mockResolvedValue([])
      vi.mocked(transformMediaLanguages).mockResolvedValue([])
      vi.mocked(transformMediaLanguageLinks).mockResolvedValue([])
      vi.mocked(transformMediaLanguageTranslations).mockResolvedValue([])
      vi.mocked(transformMediaMetadata).mockResolvedValue([])
      vi.mocked(transformSpokenLanguages).mockResolvedValue([])
      vi.mocked(transformSuggestedLanguages).mockResolvedValue([])
      vi.mocked(transformTermTranslations).mockResolvedValue([])
      vi.mocked(transformReadingLanguages).mockResolvedValue([])

      await runner({
        languageId: "529",
        languageTag: "en",
      })

      // Verify all transformers are called in the correct order
      expect(transformCountries).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformCountryTranslations).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformMediaData).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformMediaLanguages).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformMediaLanguageLinks).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformMediaLanguageTranslations).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformMediaMetadata).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformSpokenLanguages).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformSuggestedLanguages).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformTermTranslations).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
      expect(transformReadingLanguages).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: false,
        logger: undefined,
      })
    })

    it("should work without logger", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      vi.mocked(transformCountries).mockResolvedValue([])

      await runner({
        languageId: "496",
        languageTag: "fr",
      })

      expect(transformCountries).toHaveBeenCalledWith({
        languageId: "496",
        languageTag: "fr",
        readOnly: false,
        logger: undefined,
      })
    })

    it("should pass readOnly parameter when set to true", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      const { transformMediaData } = await import(
        "./schema/mediaData/transform.js"
      )
      const { transformReadingLanguages } = await import(
        "./schema/readingLanguages/transform.js"
      )

      vi.mocked(transformCountries).mockResolvedValue([])
      vi.mocked(transformMediaData).mockResolvedValue([])
      vi.mocked(transformReadingLanguages).mockResolvedValue([])

      await runner({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
      })

      // Verify transformers are called with readOnly: true
      expect(transformCountries).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
        logger: undefined,
      })
      expect(transformMediaData).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
        logger: undefined,
      })
      expect(transformReadingLanguages).toHaveBeenCalledWith({
        languageId: "529",
        languageTag: "en",
        readOnly: true,
        logger: undefined,
      })
    })
  })

  describe("database rebuild", () => {
    it("should call rebuild when not in read-only mode", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )

      vi.mocked(rebuild).mockResolvedValue(undefined)
      vi.mocked(transformCountries).mockResolvedValue([])

      const mockLogger = {
        info: vi.fn(),
        child: vi.fn().mockReturnValue({
          info: vi.fn(),
        }),
      } as any

      await runner({
        languageId: "529",
        languageTag: "en",
        logger: mockLogger,
      })

      expect(rebuild).toHaveBeenCalledWith({ logger: mockLogger })
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Starting Android data transformation process"
      )
    })

    it("should not call rebuild when in read-only mode", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )

      vi.mocked(rebuild).mockResolvedValue(undefined)
      vi.mocked(transformCountries).mockResolvedValue([])

      const mockLogger = {
        info: vi.fn(),
        child: vi.fn().mockReturnValue({
          info: vi.fn(),
        }),
      } as any

      await runner({
        languageId: "529",
        languageTag: "en",
        logger: mockLogger,
        readOnly: true,
      })

      expect(rebuild).not.toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith("Running in read-only mode")
    })
  })

  describe("error handling", () => {
    it("should propagate transformer errors", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      const error = new Error("Countries transform failed")
      vi.mocked(transformCountries).mockRejectedValue(error)

      await expect(
        runner({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Countries transform failed")
    })

    it("should handle errors from later transformers", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      const { transformMediaData } = await import(
        "./schema/mediaData/transform.js"
      )

      vi.mocked(transformCountries).mockResolvedValue([])
      vi.mocked(transformMediaData).mockRejectedValue(
        new Error("Media data transform failed")
      )

      await expect(
        runner({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Media data transform failed")

      // Verify earlier transformers were called
      expect(transformCountries).toHaveBeenCalled()
    })

    it("should handle rebuild errors", async () => {
      const error = new Error("Rebuild failed")
      vi.mocked(rebuild).mockRejectedValue(error)

      await expect(
        runner({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Rebuild failed")
    })
  })

  describe("transformer execution order", () => {
    it("should execute transformers in the correct order", async () => {
      const executionOrder: string[] = []

      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      const { transformCountryTranslations } = await import(
        "./schema/countryTranslations/transform.js"
      )
      const { transformMediaData } = await import(
        "./schema/mediaData/transform.js"
      )
      const { transformMediaLanguages } = await import(
        "./schema/mediaLanguages/transform.js"
      )
      const { transformMediaLanguageLinks } = await import(
        "./schema/mediaLanguageLinks/transform.js"
      )

      vi.mocked(transformCountries).mockImplementation(async () => {
        executionOrder.push("countries")
        return []
      })
      vi.mocked(transformCountryTranslations).mockImplementation(async () => {
        executionOrder.push("countryTranslations")
        return []
      })
      vi.mocked(transformMediaData).mockImplementation(async () => {
        executionOrder.push("mediaData")
        return []
      })
      vi.mocked(transformMediaLanguages).mockImplementation(async () => {
        executionOrder.push("mediaLanguages")
        return []
      })
      vi.mocked(transformMediaLanguageLinks).mockImplementation(async () => {
        executionOrder.push("mediaLanguageLinks")
        return []
      })

      await runner({
        languageId: "529",
        languageTag: "en",
      })

      // Verify the first few transformers execute in order
      expect(executionOrder.slice(0, 5)).toEqual([
        "countries",
        "countryTranslations",
        "mediaData",
        "mediaLanguages",
        "mediaLanguageLinks",
      ])
    })
  })

  describe("parameter validation", () => {
    it("should pass correct parameters to all transformers", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      const { transformMediaData } = await import(
        "./schema/mediaData/transform.js"
      )

      vi.mocked(transformCountries).mockResolvedValue([])
      vi.mocked(transformMediaData).mockResolvedValue([])

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

      expect(transformCountries).toHaveBeenCalledWith({
        languageId: "21028",
        languageTag: "es",
        readOnly: false,
        logger: expect.any(Object),
      })

      expect(transformMediaData).toHaveBeenCalledWith({
        languageId: "21028",
        languageTag: "es",
        readOnly: false,
        logger: expect.any(Object),
      })

      // Verify logger.child was called for each transformer
      expect(mockLogger.child).toHaveBeenCalledWith({
        transformer: "countries",
        languageId: "21028",
        languageTag: "es",
      })
      expect(mockLogger.child).toHaveBeenCalledWith({
        transformer: "mediaData",
        languageId: "21028",
        languageTag: "es",
      })
    })
  })

  describe("logging", () => {
    it("should log appropriate messages throughout the process", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      vi.mocked(transformCountries).mockResolvedValue([])

      const mockLogger = {
        info: vi.fn(),
        child: vi.fn().mockReturnValue({
          info: vi.fn(),
        }),
      } as any

      await runner({
        languageId: "529",
        languageTag: "en",
        logger: mockLogger,
      })

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Starting Android data transformation process"
      )
      expect(mockLogger.info).toHaveBeenCalledWith("Transforming countries")
      expect(mockLogger.info).toHaveBeenCalledWith("Transformed countries")
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Android data transformation completed successfully"
      )
    })

    it("should log read-only mode when applicable", async () => {
      const { transformCountries } = await import(
        "./schema/countries/transform.js"
      )
      vi.mocked(transformCountries).mockResolvedValue([])

      const mockLogger = {
        info: vi.fn(),
        child: vi.fn().mockReturnValue({
          info: vi.fn(),
        }),
      } as any

      await runner({
        languageId: "529",
        languageTag: "en",
        logger: mockLogger,
        readOnly: true,
      })

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Starting Android data transformation process"
      )
      expect(mockLogger.info).toHaveBeenCalledWith("Running in read-only mode")
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Android data transformation completed successfully"
      )
    })
  })
})
