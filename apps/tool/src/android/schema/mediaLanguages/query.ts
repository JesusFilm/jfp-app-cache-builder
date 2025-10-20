import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_MediaLanguagesQuery = graphql(`
  query JFPAppCacheBuilder_Android_MediaLanguagesQuery {
    languages {
      mediaLanguageId: id
      name(languageId: 529) {
        value
      }
      nameNative: name(primary: true) {
        value
      }
      iso3
      bcp47
      audioPreviewURL: audioPreview {
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
