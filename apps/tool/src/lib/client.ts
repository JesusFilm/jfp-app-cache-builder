/* global process */

import pkg from "@apollo/client/core/core.cjs"
const { ApolloClient, InMemoryCache, createHttpLink } = pkg

const httpLink = createHttpLink({
  uri: "https://api-gateway.central.jesusfilm.org",
  headers: {
    "x-graphql-client-name": "jfp-app-cache-builder",
    "x-graphql-client-version": process.env["GIT_COMMIT_SHA"] ?? "",
  },
})

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})
