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
      name(languageId: $languageId) {
        value
      }
      continent {
        name(languageId: $languageId) {
          value
        }
      }
    }
    languageData: languages {
      languageId: id
      name(languageId: $languageId) {
        value
      }
      nameNative: name(primary: true) {
        value
      }
    }
    mediaItemData: videos {
      mediaComponentId: id
      longDescription: description(languageId: $languageId) {
        value
      }
      shortDescription: snippet(languageId: $languageId) {
        value
      }
      name: title(languageId: $languageId) {
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
