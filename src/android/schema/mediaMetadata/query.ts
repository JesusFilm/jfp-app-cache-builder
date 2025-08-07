import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_MediaMetadataQuery = graphql(`
  query JFPAppCacheBuilder_Android_MediaMetadataQuery(
    $limit: Int
    $offset: Int
  ) {
    videos(limit: $limit, offset: $offset) {
      id
      title {
        value
        language {
          metadataLanguageTag: bcp47
        }
      }
      longDescription: description {
        value
        language {
          metadataLanguageTag: bcp47
        }
      }
      shortDescription: snippet {
        value
        language {
          metadataLanguageTag: bcp47
        }
      }
      studyQuestions {
        value
        order
        language {
          metadataLanguageTag: bcp47
        }
      }
    }
  }
`)
