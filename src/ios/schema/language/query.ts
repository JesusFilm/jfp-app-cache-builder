import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_iOS_LanguageQuery = graphql(`
  query JFPAppCacheBuilder_iOS_LanguageQuery($languageId: ID!) {
    languages {
      id
      audioPreviewURL: audioPreview {
        value
      }
      iso3
      bcp47
      englishName: name(languageId: 529) {
        value
      }
      name: name(languageId: $languageId) {
        value
      }
      nameNative: name(primary: true) {
        value
      }
      countryLanguages {
        country {
          id
        }
        primary
        speakerCount: displaySpeakers
      }
    }
  }
`)
