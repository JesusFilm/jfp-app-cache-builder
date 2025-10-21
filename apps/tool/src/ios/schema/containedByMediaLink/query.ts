import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_iOS_ContainedByMediaLinkQuery = graphql(`
  query JFPAppCacheBuilder_iOS_ContainedByMediaLinkQuery {
    videos(where: { labels: [collection, series] }) {
      parentMediaComponentId: id
      children {
        mediaComponentId: id
      }
    }
  }
`)
