import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_CountryTranslationsQuery = graphql(`
  query JFPAppCacheBuilder_Android_CountryTranslationsQuery {
    countries {
      countryId: id
      name {
        value
        language {
          id
          bcp47
        }
      }
    }
  }
`)
