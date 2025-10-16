import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_iOS_ReadingLanguageDataQuery = graphql(`
  query JFPAppCacheBuilder_iOS_ReadingLanguageDataQuery($languageId: ID) {
    bibleCodeData: bibleBooks {
      name: osisId
      fullName: name(languageId: $languageId) {
        value
      }
    }
    countryData: countries {
      countryId: id
      name(languageId: $languageId, primary: true) {
        value
      }
      continent {
        name(languageId: $languageId, primary: true) {
          value
        }
      }
    }
    languageData: languages {
      languageId: id
      name(languageId: $languageId, primary: true) {
        value
      }
      nameNative: name(primary: true) {
        value
      }
    }
    mediaItemData: videos(limit: 10000) {
      mediaComponentId: id
      longDescription: description(languageId: $languageId, primary: true) {
        value
      }
      shortDescription: snippet(languageId: $languageId, primary: true) {
        value
      }
      name: title(languageId: $languageId, primary: true) {
        value
      }
      studyQuestions(languageId: $languageId) {
        value
      }
      bibleCitations {
        chapterEnd
        verseStart
        osisBibleBook: osisId
        chapterStart
        verseEnd
      }
    }
  }
`)
