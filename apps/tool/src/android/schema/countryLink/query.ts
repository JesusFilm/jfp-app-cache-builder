import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_CountryLinkQuery = graphql(`
  query JFPAppCacheBuilder_Android_CountryLinkQuery {
    countries {
      id
      countryLanguages {
        language {
          id
        }
        speakerCount: speakers
      }
    }
  }
`)
