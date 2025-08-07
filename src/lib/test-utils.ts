import { ApolloQueryResult } from "@apollo/client"

// Helper function to create properly typed mock responses
export function createMockResponse<T>(data: T): ApolloQueryResult<T> {
  return {
    data,
    loading: false,
    networkStatus: 7,
  }
}
