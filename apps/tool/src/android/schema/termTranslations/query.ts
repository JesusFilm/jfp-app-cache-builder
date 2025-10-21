import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_TermTranslationsQuery = graphql(`
  query JFPAppCacheBuilder_Android_TermTranslationsQuery {
    taxonomies {
      label: term
      term: name {
        value: label
        language {
          languageTag: bcp47
        }
      }
    }
  }
`)
