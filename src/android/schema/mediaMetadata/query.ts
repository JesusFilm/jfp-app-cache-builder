import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_MediaMetadataQuery = graphql(`
  query JFPAppCacheBuilder_Android_MediaMetadataQuery(
    $limit: Int
    $offset: Int
  ) {
    videos(limit: $limit, offset: $offset) {
      id
      title(primary: false) {
        value
        language {
          metadataLanguageTag: bcp47
        }
      }
      longDescription: description(primary: false) {
        value
        language {
          metadataLanguageTag: bcp47
        }
      }
      shortDescription: snippet(primary: false) {
        value
        language {
          metadataLanguageTag: bcp47
        }
      }
      studyQuestions(primary: false) {
        value
        order
        language {
          metadataLanguageTag: bcp47
        }
      }
    }
  }
`)
