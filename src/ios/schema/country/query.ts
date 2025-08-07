import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_iOS_CountryQuery = graphql(`
  query JFPAppCacheBuilder_iOS_CountryQuery($languageId: ID!) {
    countries {
      countryId: id
      flagUrlPng: flagPngSrc
      flagUrlWebPLossy50: flagWebpSrc
      latitude
      longitude
      countryPopulation: population
      languageCount
      languageCountHavingMedia: languageHavingMediaCount
      continent {
        englishContinentName: name(languageId: 529) {
          value
        }
        continentName: name(languageId: $languageId) {
          value
        }
      }
      englishName: name(languageId: 529) {
        value
      }
      name: name(languageId: $languageId) {
        value
      }
      countryLanguages {
        suggested
        language {
          id
        }
      }
    }
  }
`)
