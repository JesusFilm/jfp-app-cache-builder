/* global process */

import pkg from "@apollo/client/core/core.cjs"
const { ApolloClient, ApolloLink, InMemoryCache, Observable, createHttpLink } =
  pkg

// Cache reads are idempotent. A transient server response must not abort an
// otherwise complete cache build or allow partial data into the cache.
const retryLink = new ApolloLink((operation, forward) => {
  const isQuery = operation.query.definitions.some(
    (definition) =>
      definition.kind === "OperationDefinition" &&
      definition.operation === "query"
  )

  return new Observable((observer) => {
    let attempts = 0
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let subscription: { unsubscribe: () => void } | undefined

    const run = () => {
      if (cancelled) return
      attempts += 1
      let scheduled = false
      const retry = () => {
        if (!isQuery || cancelled || attempts >= 3) return false
        scheduled = true
        timer = setTimeout(run, 1000 * 2 ** (attempts - 1))
        return true
      }

      subscription = forward(operation).subscribe({
        next(result) {
          if (scheduled || cancelled) return
          const transient =
            result.errors?.length &&
            result.errors.every(
              (error) => error.extensions?.["code"] === "INTERNAL_SERVER_ERROR"
            )
          if (transient && retry()) return
          observer.next(result)
        },
        error(error: unknown) {
          if (scheduled || cancelled) return
          const status =
            error instanceof Error && "statusCode" in error
              ? error.statusCode
              : undefined
          const transient =
            typeof status === "number"
              ? status >= 500 && status <= 599
              : error instanceof TypeError ||
                (error instanceof Error && error.name === "FetchError")
          if (transient && retry()) return
          observer.error(error)
        },
        complete() {
          if (!scheduled) observer.complete()
        },
      })
    }

    run()
    return () => {
      cancelled = true
      clearTimeout(timer)
      subscription?.unsubscribe()
    }
  })
})

const httpLink = createHttpLink({
  uri: "https://api-gateway.central.jesusfilm.org",
  headers: {
    "x-graphql-client-name": "jfp-app-cache-builder",
    "x-graphql-client-version": process.env["GIT_COMMIT_SHA"] ?? "",
  },
})

export const client = new ApolloClient({
  link: ApolloLink.from([retryLink, httpLink]),
  cache: new InMemoryCache(),
})
