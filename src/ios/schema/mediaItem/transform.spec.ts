import { Buffer } from "buffer"

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { client } from "../../../lib/client.js"
import { createMockResponse } from "../../../lib/test-utils.js"
import { getDb } from "../../lib/db.js"

import { transformMediaItems } from "./transform.js"

// Mock the dependencies
vi.mock("../../../lib/client.js")
vi.mock("../../lib/db.js")

const mockClient = vi.mocked(client)
const mockGetDb = vi.mocked(getDb)

describe("transformMediaItems", () => {
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
    it("should transform media items and write to database", async () => {
      // Mock API response
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageCount: 2,
            primaryLanguageId: "529",
            subType: "featureFilm",
            images: [
              {
                highResImageUrl: "https://example.com/high.jpg",
                lowResImageUrl: "https://example.com/low.jpg",
                veryLowResImageUrl: "https://example.com/verylow.jpg",
                thumbnailUrl: "https://example.com/thumb.jpg",
                videoStillUrl: "https://example.com/still.jpg",
              },
            ],
            languageIds: [{ id: "529" }, { id: "21028" }],
            variant: {
              mediaComponentId: "video1",
              lengthInSeconds: 120,
              isDownloadable: true,
              downloads: [
                { quality: "high", approxDownloadSize: 1000000 },
                { quality: "low", approxDownloadSize: 500000 },
              ],
            },
            groupContentCount: 0,
            englishLongDescription: [{ value: "English long description" }],
            longDescription: [{ value: "Long description" }],
            englishShortDescription: [{ value: "English short description" }],
            shortDescription: [{ value: "Short description" }],
            englishName: [{ value: "English Title" }],
            name: [{ value: "Title" }],
            bibleCitationsData: [
              {
                osisBibleBook: "Gen",
                verseStart: 1,
                verseEnd: 10,
                chapterStart: 1,
                chapterEnd: 1,
              },
            ],
            englishStudyQuestionsData: [{ value: "English study question" }],
            studyQuestionsData: [{ value: "Study question" }],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] }))

      const result = await transformMediaItems({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { limit: 100, offset: 0, languageId: "529" },
      })

      // Verify getDb was called
      expect(mockGetDb).toHaveBeenCalled()

      // Verify database write was called
      expect(mockDb.write).toHaveBeenCalled()
      expect(mockDb.create).toHaveBeenCalledTimes(1)

      // Verify the transformed data
      expect(result).toEqual([
        {
          mediaComponentId: "video1",
          languageCount: 2,
          sort: "",
          primaryLanguageId: "529",
          componentType: "content",
          contentType: "video",
          lengthInSeconds: 120,
          approxLargeDownloadSize: 1000000,
          approxSmallDownloadSize: 500000,
          highResImageUrl: "https://example.com/high.jpg",
          lowResImageUrl: "https://example.com/low.jpg",
          veryLowResImageUrl: "https://example.com/verylow.jpg",
          thumbnailUrl: "https://example.com/thumb.jpg",
          videoStillUrl: "https://example.com/still.jpg",
          isDownloadable: true,
          languageIds: "|529|,|21028|",
          subType: "featureFilm",
          groupContentCount: 0,
          currentDescriptorLanguageId: "529",
          metadataLanguageTag: "en",
          englishLongDescription: "English long description",
          longDescription: "Long description",
          englishShortDescription: "English short description",
          shortDescription: "Short description",
          englishName: "English Title",
          name: "Title",
          englishBibleCitationsData: Buffer.from(
            JSON.stringify([
              {
                osisBibleBook: "Gen",
                verseStart: 1,
                verseEnd: 10,
                chapterStart: 1,
                chapterEnd: 1,
              },
            ]),
            "utf-8"
          ),
          bibleCitationsData: Buffer.from(
            JSON.stringify([
              {
                osisBibleBook: "Gen",
                verseStart: 1,
                verseEnd: 10,
                chapterStart: 1,
                chapterEnd: 1,
              },
            ]),
            "utf-8"
          ),
          englishStudyQuestionsData: Buffer.from(
            JSON.stringify([{ studyQuestion: "English study question" }]),
            "utf-8"
          ),
          studyQuestionsData: Buffer.from(
            JSON.stringify([{ studyQuestion: "Study question" }]),
            "utf-8"
          ),
        },
      ])
    })

    it("should work in read-only mode", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video2",
            languageCount: 1,
            primaryLanguageId: "21028",
            subType: "series",
            images: [],
            languageIds: [{ id: "21028" }],
            variant: {
              mediaComponentId: "video2",
              lengthInSeconds: 0,
              isDownloadable: false,
              downloads: [],
            },
            groupContentCount: 5,
            englishLongDescription: [],
            longDescription: [],
            englishShortDescription: [],
            shortDescription: [],
            englishName: [{ value: "Series Title" }],
            name: [{ value: "Series Title" }],
            bibleCitationsData: [],
            englishStudyQuestionsData: [],
            studyQuestionsData: [],
          },
        ],
      })

      // Mock the pagination behavior - first call returns data, second call returns empty
      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] }))

      const result = await transformMediaItems({
        languageId: "21028",
        languageTag: "es",
        readOnly: true,
      })

      // Verify no database write in read-only mode
      expect(mockDb.write).not.toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()

      // Verify transformation still works
      expect(result).toEqual([
        {
          mediaComponentId: "video2",
          languageCount: 1,
          sort: "",
          primaryLanguageId: "21028",
          componentType: "container",
          contentType: "none",
          lengthInSeconds: 0,
          approxLargeDownloadSize: undefined,
          approxSmallDownloadSize: undefined,
          highResImageUrl: "",
          lowResImageUrl: "",
          veryLowResImageUrl: "",
          thumbnailUrl: "",
          videoStillUrl: "",
          isDownloadable: false,
          languageIds: "|21028|",
          subType: "series",
          groupContentCount: 5,
          currentDescriptorLanguageId: "21028",
          metadataLanguageTag: "es",
          englishLongDescription: "",
          longDescription: "",
          englishShortDescription: "",
          shortDescription: "",
          englishName: "Series Title",
          name: "Series Title",
          englishBibleCitationsData: undefined,
          bibleCitationsData: undefined,
          englishStudyQuestionsData: undefined,
          studyQuestionsData: undefined,
        },
      ])
    })

    it("should handle pagination correctly", async () => {
      // First page
      const mockApiResponse1 = createMockResponse({
        videos: [
          {
            id: "video1",
            languageCount: 1,
            primaryLanguageId: "529",
            subType: "featureFilm",
            images: [],
            languageIds: [{ id: "529" }],
            variant: {
              mediaComponentId: "video1",
              lengthInSeconds: 120,
              isDownloadable: true,
              downloads: [],
            },
            groupContentCount: 0,
            englishLongDescription: [],
            longDescription: [],
            englishShortDescription: [],
            shortDescription: [],
            englishName: [{ value: "Video 1" }],
            name: [{ value: "Video 1" }],
            bibleCitationsData: [],
            englishStudyQuestionsData: [],
            studyQuestionsData: [],
          },
        ],
      })

      // Second page (empty)
      const mockApiResponse2 = createMockResponse({
        videos: [],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse1)
        .mockResolvedValueOnce(mockApiResponse2)
        .mockResolvedValueOnce(createMockResponse({ videos: [] }))

      const result = await transformMediaItems({
        languageId: "529",
        languageTag: "en",
      })

      // Verify API was called twice with correct pagination
      expect(mockClient.query).toHaveBeenCalledTimes(2)
      expect(mockClient.query).toHaveBeenNthCalledWith(1, {
        query: expect.any(Object),
        variables: { limit: 100, offset: 0, languageId: "529" },
      })
      expect(mockClient.query).toHaveBeenNthCalledWith(2, {
        query: expect.any(Object),
        variables: { limit: 100, offset: 100, languageId: "529" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.mediaComponentId).toBe("video1")
    })
  })

  describe("edge cases", () => {
    it("should handle empty videos array", async () => {
      mockClient.query.mockResolvedValueOnce(createMockResponse({ videos: [] }))

      const result = await transformMediaItems({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([])
      expect(mockDb.write).not.toHaveBeenCalled()
      expect(mockDb.create).not.toHaveBeenCalled()
    })

    it("should handle missing optional fields", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video3",
            languageCount: null,
            primaryLanguageId: null,
            subType: null,
            images: null,
            languageIds: null,
            variant: null,
            groupContentCount: null,
            englishLongDescription: null,
            longDescription: null,
            englishShortDescription: null,
            shortDescription: null,
            englishName: null,
            name: null,
            bibleCitationsData: [],
            englishStudyQuestionsData: [],
            studyQuestionsData: [],
          },
        ],
      })

      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] }))

      const result = await transformMediaItems({
        languageId: "529",
        languageTag: "en",
      })

      expect(result).toEqual([
        {
          mediaComponentId: "video3",
          languageCount: 0,
          sort: "",
          primaryLanguageId: "",
          componentType: "content",
          contentType: "video",
          lengthInSeconds: 0,
          approxLargeDownloadSize: undefined,
          approxSmallDownloadSize: undefined,
          highResImageUrl: "",
          lowResImageUrl: "",
          veryLowResImageUrl: "",
          thumbnailUrl: "",
          videoStillUrl: "",
          isDownloadable: false,
          languageIds: "",
          subType: "",
          groupContentCount: 0,
          currentDescriptorLanguageId: "529",
          metadataLanguageTag: "en",
          englishLongDescription: "",
          longDescription: "",
          englishShortDescription: "",
          shortDescription: "",
          englishName: "",
          name: "",
          englishBibleCitationsData: undefined,
          bibleCitationsData: undefined,
          englishStudyQuestionsData: undefined,
          studyQuestionsData: undefined,
        },
      ])
    })

    it("should handle different subTypes correctly", async () => {
      const testCases = [
        {
          subType: "collection",
          expectedComponentType: "container",
          expectedContentType: "none",
        },
        {
          subType: "series",
          expectedComponentType: "container",
          expectedContentType: "none",
        },
        {
          subType: "featureFilm",
          expectedComponentType: "content",
          expectedContentType: "video",
        },
        {
          subType: "episode",
          expectedComponentType: "content",
          expectedContentType: "video",
        },
        {
          subType: "segment",
          expectedComponentType: "content",
          expectedContentType: "video",
        },
      ]

      for (const testCase of testCases) {
        const mockApiResponse = createMockResponse({
          videos: [
            {
              id: `video-${testCase.subType}`,
              languageCount: 1,
              primaryLanguageId: "529",
              subType: testCase.subType,
              images: [],
              languageIds: [{ id: "529" }],
              variant: {
                mediaComponentId: `video-${testCase.subType}`,
                lengthInSeconds: 120,
                isDownloadable: true,
                downloads: [],
              },
              groupContentCount: 0,
              englishLongDescription: [],
              longDescription: [],
              englishShortDescription: [],
              shortDescription: [],
              englishName: [{ value: `Video ${testCase.subType}` }],
              name: [{ value: `Video ${testCase.subType}` }],
              bibleCitationsData: [],
              englishStudyQuestionsData: [],
              studyQuestionsData: [],
            },
          ],
        })

        // Mock the pagination behavior - first call returns data, second call returns empty
        mockClient.query
          .mockResolvedValueOnce(mockApiResponse)
          .mockResolvedValueOnce(createMockResponse({ videos: [] }))

        const result = await transformMediaItems({
          languageId: "529",
          languageTag: "en",
        })

        expect(result[0]?.componentType).toBe(testCase.expectedComponentType)
        expect(result[0]?.contentType).toBe(testCase.expectedContentType)
      }
    })
  })

  describe("error handling", () => {
    it("should handle GraphQL query errors", async () => {
      const mockError = new Error("GraphQL query failed")
      mockClient.query.mockRejectedValue(mockError)

      await expect(
        transformMediaItems({
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
            id: "video1",
            languageCount: 1,
            primaryLanguageId: "529",
            subType: "featureFilm",
            images: [],
            languageIds: [{ id: "529" }],
            variant: {
              mediaComponentId: "video1",
              lengthInSeconds: 120,
              isDownloadable: true,
              downloads: [],
            },
            groupContentCount: 0,
            englishLongDescription: [],
            longDescription: [],
            englishShortDescription: [],
            shortDescription: [],
            englishName: [{ value: "Video 1" }],
            name: [{ value: "Video 1" }],
            bibleCitationsData: [],
            englishStudyQuestionsData: [],
            studyQuestionsData: [],
          },
        ],
      })

      // Mock the pagination behavior - first call returns data, second call returns empty
      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] }))

      mockDb.write.mockImplementation(() => {
        throw new Error("Database write failed")
      })

      await expect(
        transformMediaItems({
          languageId: "529",
          languageTag: "en",
        })
      ).rejects.toThrow("Database write failed")
    })
  })

  describe("data validation", () => {
    it("should correctly handle bible citations data", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageCount: 1,
            primaryLanguageId: "529",
            subType: "featureFilm",
            images: [],
            languageIds: [{ id: "529" }],
            variant: {
              mediaComponentId: "video1",
              lengthInSeconds: 120,
              isDownloadable: true,
              downloads: [],
            },
            groupContentCount: 0,
            englishLongDescription: [],
            longDescription: [],
            englishShortDescription: [],
            shortDescription: [],
            englishName: [{ value: "Video 1" }],
            name: [{ value: "Video 1" }],
            bibleCitationsData: [
              {
                osisBibleBook: "Gen",
                verseStart: 1,
                verseEnd: 10,
                chapterStart: 1,
                chapterEnd: 1,
              },
              {
                osisBibleBook: "Exo",
                verseStart: 1,
                verseEnd: 5,
                chapterStart: 1,
                chapterEnd: 1,
              },
            ],
            englishStudyQuestionsData: [],
            studyQuestionsData: [],
          },
        ],
      })

      // Mock the pagination behavior - first call returns data, second call returns empty
      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] }))

      const result = await transformMediaItems({
        languageId: "529",
        languageTag: "en",
      })

      const expectedBibleCitations = [
        {
          osisBibleBook: "Gen",
          verseStart: 1,
          verseEnd: 10,
          chapterStart: 1,
          chapterEnd: 1,
        },
        {
          osisBibleBook: "Exo",
          verseStart: 1,
          verseEnd: 5,
          chapterStart: 1,
          chapterEnd: 1,
        },
      ]

      expect(result[0]?.bibleCitationsData).toEqual(
        Buffer.from(JSON.stringify(expectedBibleCitations), "utf-8")
      )
    })

    it("should correctly handle study questions data", async () => {
      const mockApiResponse = createMockResponse({
        videos: [
          {
            id: "video1",
            languageCount: 1,
            primaryLanguageId: "529",
            subType: "featureFilm",
            images: [],
            languageIds: [{ id: "529" }],
            variant: {
              mediaComponentId: "video1",
              lengthInSeconds: 120,
              isDownloadable: true,
              downloads: [],
            },
            groupContentCount: 0,
            englishLongDescription: [],
            longDescription: [],
            englishShortDescription: [],
            shortDescription: [],
            englishName: [{ value: "Video 1" }],
            name: [{ value: "Video 1" }],
            bibleCitationsData: [],
            englishStudyQuestionsData: [
              { value: "English question 1" },
              { value: "English question 2" },
            ],
            studyQuestionsData: [
              { value: "Question 1" },
              { value: "Question 2" },
            ],
          },
        ],
      })

      // Mock the pagination behavior - first call returns data, second call returns empty
      mockClient.query
        .mockResolvedValueOnce(mockApiResponse)
        .mockResolvedValueOnce(createMockResponse({ videos: [] }))

      const result = await transformMediaItems({
        languageId: "529",
        languageTag: "en",
      })

      const expectedEnglishStudyQuestions = [
        { studyQuestion: "English question 1" },
        { studyQuestion: "English question 2" },
      ]

      const expectedStudyQuestions = [
        { studyQuestion: "Question 1" },
        { studyQuestion: "Question 2" },
      ]

      expect(result[0]?.englishStudyQuestionsData).toEqual(
        Buffer.from(JSON.stringify(expectedEnglishStudyQuestions), "utf-8")
      )
      expect(result[0]?.studyQuestionsData).toEqual(
        Buffer.from(JSON.stringify(expectedStudyQuestions), "utf-8")
      )
    })
  })
})
