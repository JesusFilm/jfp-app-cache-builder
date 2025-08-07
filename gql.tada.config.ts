import { defineConfig } from 'gql.tada';

export default defineConfig({
  schema: './schema.graphql',
  tadaOutputLocation: './src/gql.tada.ts',
}); 