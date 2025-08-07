import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_iOS_MediaItemQuery = graphql(`
  query JFPAppCacheBuilder_iOS_MediaItemQuery(
    $limit: Int
    $offset: Int
    $languageId: ID
  ) {
    videos(limit: $limit, offset: $offset) {
      id
      languageCount: variantLanguagesCount
      primaryLanguageId
      # componentType
      # contentType
      subType: label # used to determine componentType and contentType
      images {
        highResImageUrl: mobileCinematicHigh
        lowResImageUrl: mobileCinematicLow
        veryLowResImageUrl: mobileCinematicVeryLow
        thumbnailUrl: thumbnail
        videoStillUrl: videoStill
      }
      languageIds: variantLanguages {
        id
      }
      variant(languageId: $languageId) {
        mediaComponentId: id
        lengthInSeconds: duration
        isDownloadable: downloadable
        downloads {
          quality
          approxDownloadSize: size
        }
      }
      groupContentCount: childrenCount
      englishLongDescription: description(languageId: 529) {
        value
      }
      longDescription: description(languageId: $languageId) {
        value
      }
      englishShortDescription: snippet(languageId: 529) {
        value
      }
      shortDescription: snippet(languageId: $languageId) {
        value
      }
      englishName: title(languageId: 529) {
        value
      }
      name: title(languageId: $languageId) {
        value
      }
      bibleCitationsData: bibleCitations {
        osisBibleBook: osisId
        verseStart
        verseEnd
        chapterStart
        chapterEnd
      }
      englishStudyQuestionsData: studyQuestions(languageId: 529) {
        value
      }
      studyQuestionsData: studyQuestions(languageId: $languageId) {
        value
      }
    }
  }
`)
