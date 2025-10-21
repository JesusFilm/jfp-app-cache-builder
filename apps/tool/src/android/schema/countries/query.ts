import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_CountriesQuery = graphql(`
  query JFPAppCacheBuilder_Android_CountriesQuery($languageId: ID!) {
    countries {
      countryId: id
      name: name(languageId: $languageId) {
        value
      }
      continent {
        continentName: name(languageId: $languageId) {
          value
        }
      }
      languageHavingMediaCount
      population
      longitude
      latitude
      flagLossyWeb: flagWebpSrc
      flagPng8: flagPngSrc
    }
  }
`)
