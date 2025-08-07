import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_iOS_CountryLinkQuery = graphql(`
  query JFPAppCacheBuilder_iOS_CountryLinkQuery {
    countries {
      id
      countryLanguages {
        language {
          id
        }
        speakerCount: displaySpeakers
      }
    }
  }
`)
