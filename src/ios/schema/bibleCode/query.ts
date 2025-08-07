import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_iOS_BibleCodeQuery = graphql(`
  query JFPAppCacheBuilder_iOS_BibleCodeQuery($languageId: ID!) {
    bibleBooks {
      name: osisId
      englishFullName: name(languageId: 529) {
        value
      }
      fullName: name(languageId: $languageId) {
        value
      }
    }
  }
`)
