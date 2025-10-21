import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_iOS_SuggestedLanguageQuery = graphql(`
  query JFPAppCacheBuilder_iOS_SuggestedLanguageQuery {
    countries {
      id
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
