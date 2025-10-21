import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_MediaLanguageTranslationsQuery =
  graphql(`
    query JFPAppCacheBuilder_Android_MediaLanguageTranslationsQuery {
      languages {
        id
        name {
          value
          language {
            metadataLanguageTag: bcp47
          }
        }
      }
    }
  `)
