import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_SuggestedLanguagesQuery = graphql(`
  query JFPAppCacheBuilder_Android_SuggestedLanguagesQuery {
    countries {
      countryId: id
      countryLanguages {
        language {
          id
        }
        suggested
        languageRank: order
      }
    }
  }
`)
