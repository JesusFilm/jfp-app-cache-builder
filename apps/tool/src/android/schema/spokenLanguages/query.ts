import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_SpokenLanguagesQuery = graphql(`
  query JFPAppCacheBuilder_Android_SpokenLanguagesQuery {
    countries {
      countryId: id
      countryLanguages {
        language {
          id
        }
        speakers
      }
    }
  }
`)
