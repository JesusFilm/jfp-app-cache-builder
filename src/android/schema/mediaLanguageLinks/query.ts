import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_MediaLanguageLinksQuery = graphql(`
  query JFPAppCacheBuilder_Android_MediaLanguageLinksQuery(
    $limit: Int
    $offset: Int
  ) {
    videos(limit: $limit, offset: $offset) {
      id
      languageIds: variantLanguages {
        id
      }
    }
  }
`)
