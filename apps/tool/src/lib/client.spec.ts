import pkg from "@apollo/client/core/core.cjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { gql } = pkg
const query = gql`
  query CacheRetryTest {
    __typename
  }
`

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  })
}

describe("cache API client", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("recovers from a transient GraphQL server error without returning partial data", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        response({
          data: { __typename: "Partial" },
          errors: [
            {
              message: "Unexpected error.",
              extensions: { code: "INTERNAL_SERVER_ERROR" },
            },
          ],
        })
      )
      .mockResolvedValueOnce(response({ data: { __typename: "Query" } }))
    vi.stubGlobal("fetch", fetch)
    const { client } = await import("./client.js")
    const result = client.query({ query, fetchPolicy: "no-cache" }).then(
      (value) => ({ data: value.data }),
      (error: Error) => ({ error: error.message })
    )

    await vi.runAllTimersAsync()

    expect(await result).toEqual({ data: { __typename: "Query" } })
    expect(fetch).toHaveBeenCalledTimes(2)
    client.stop()
  })

  it("stops after three server errors and preserves the error", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () =>
        response({
          errors: [
            {
              message: "Unavailable",
              extensions: { code: "INTERNAL_SERVER_ERROR" },
            },
          ],
        })
      )
    vi.stubGlobal("fetch", fetch)
    const { client } = await import("./client.js")
    const result = client
      .query({ query, fetchPolicy: "no-cache" })
      .catch((error: Error) => error)

    await vi.runAllTimersAsync()

    expect(await result).toMatchObject({
      message: "Unavailable",
      graphQLErrors: [{ extensions: { code: "INTERNAL_SERVER_ERROR" } }],
    })
    expect(fetch).toHaveBeenCalledTimes(3)
    client.stop()
  })

  it("does not retry invalid queries", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () =>
        response({
          errors: [
            {
              message: "Invalid query",
              extensions: { code: "GRAPHQL_VALIDATION_FAILED" },
            },
          ],
        })
      )
    vi.stubGlobal("fetch", fetch)
    const { client } = await import("./client.js")
    const result = client
      .query({ query, fetchPolicy: "no-cache" })
      .catch((error: Error) => error)

    await vi.runAllTimersAsync()

    expect(await result).toMatchObject({ message: "Invalid query" })
    expect(fetch).toHaveBeenCalledTimes(1)
    client.stop()
  })

  it("recovers from a dropped connection", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(response({ data: { __typename: "Query" } }))
    vi.stubGlobal("fetch", fetch)
    const { client } = await import("./client.js")
    const result = client.query({ query, fetchPolicy: "no-cache" })

    await vi.runAllTimersAsync()

    expect((await result).data).toEqual({ __typename: "Query" })
    expect(fetch).toHaveBeenCalledTimes(2)
    client.stop()
  })

  it("does not retry authorization failures", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(
        async () => new Response("Unauthorized", { status: 401 })
      )
    vi.stubGlobal("fetch", fetch)
    const { client } = await import("./client.js")
    const result = client
      .query({ query, fetchPolicy: "no-cache" })
      .catch((error: Error) => error)

    await vi.runAllTimersAsync()

    expect(await result).toBeInstanceOf(Error)
    expect(fetch).toHaveBeenCalledTimes(1)
    client.stop()
  })

  it("does not retry mutations", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () =>
        response({
          errors: [
            {
              message: "Unavailable",
              extensions: { code: "INTERNAL_SERVER_ERROR" },
            },
          ],
        })
      )
    vi.stubGlobal("fetch", fetch)
    const { client } = await import("./client.js")
    const result = client
      .mutate({
        mutation: gql`
          mutation CacheMutation {
            __typename
          }
        `,
      })
      .catch((error: Error) => error)

    await vi.runAllTimersAsync()

    expect(await result).toBeInstanceOf(Error)
    expect(fetch).toHaveBeenCalledTimes(1)
    client.stop()
  })

  it("cancels a scheduled retry when its subscriber leaves", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () =>
        response({
          errors: [
            {
              message: "Unavailable",
              extensions: { code: "INTERNAL_SERVER_ERROR" },
            },
          ],
        })
      )
    vi.stubGlobal("fetch", fetch)
    const { client } = await import("./client.js")
    const subscription = client
      .watchQuery({ query, fetchPolicy: "no-cache" })
      .subscribe({ next: vi.fn(), error: vi.fn() })
    await vi.advanceTimersByTimeAsync(0)
    expect(fetch).toHaveBeenCalledTimes(1)

    subscription.unsubscribe()
    await vi.runAllTimersAsync()

    expect(fetch).toHaveBeenCalledTimes(1)
    client.stop()
  })
})
