# JFP App Cache Builder - Developer Guide

This document provides detailed information for developers working on the JFP App Cache Builder project.

## Architecture Overview

JFP App Cache Builder is a TypeScript-based data transformation pipeline that:

1. **Fetches data** from the Jesus Film GraphQL API
2. **Transforms data** into platform-specific schemas (Realm for iOS, SQLite for Android)
3. **Stores data** in local databases for iOS and Android consumption

### Core Components

```
src/
├── __generated__/         # Shared GraphQL types
├── lib/                   # Shared utilities
│   ├── client.ts          # Apollo GraphQL client
│   ├── languages.ts       # Manually maintained language definitions
│   └── test-utils.ts      # Test utilities
├── types/                 # Shared types (TransformOptions, RunnerOptions)
├── ios/                   # iOS-specific implementation
│   ├── lib/
│   │   └── db.ts          # Realm database setup
│   ├── schema/            # iOS Realm schemas and transformers
│   └── runner.ts          # iOS runner
├── android/               # Android-specific implementation
│   ├── lib/
│   │   └── db.ts          # Prisma/SQLite database setup
│   ├── schema/            # Android SQLite schemas and transformers
│   └── runner.ts          # Android runner
└── main.ts                # Application entry point
```

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **GraphQL Client**: Apollo Client
- **Databases**: 
  - iOS: Realm (MongoDB)
  - Android: SQLite (via Prisma)
- **Logging**: Pino with pretty formatting
- **Code Quality**: ESLint + Prettier
- **Package Manager**: pnpm
- **Build Tool**: TypeScript compiler

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9.12.3+
- TypeScript 5.9.2+

### Initial Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd jfp-app-cache-builder
   pnpm install
   ```

2. **Verify setup:**
   ```bash
   pnpm build
   pnpm lint
   ```

### Development Workflow

1. **Start development server:**
   ```bash
   pnpm dev
   ```

2. **Run linting and formatting:**
   ```bash
   pnpm lint:fix
   pnpm format
   ```

3. **Build for production:**
   ```bash
   pnpm build
   ```

## Code Structure

### Schema Organization

Each data type follows a consistent pattern:

```
schema/[typeName]/
├── realm.ts      # Realm schema definition
├── query.ts      # GraphQL query
└── transform.ts  # Data transformation logic
```

#### Example: Bible Code Schema

```typescript
// realm.ts - Realm schema definition
export class BibleCode extends Realm.Object<BibleCode> {
  name!: string
  metadataLanguageTag!: string
  currentDescriptorLanguageId!: string
  englishFullName!: string
  fullName!: string

  static schema: ObjectSchema = {
    name: "BibleCode",
    primaryKey: "name",
    properties: {
      name: "string",
      metadataLanguageTag: "string",
      currentDescriptorLanguageId: "string",
      englishFullName: "string",
      fullName: "string",
    },
  }
}
```

```typescript
// transform.ts - Data transformation logic
export async function transformBibleCodes({
  languageId,
  readOnly = false,
  logger,
}: TransformOptions) {
  const { data } = await client.query({
    query: JFPAppCacheBuilder_iOS_BibleCodeQuery,
    variables: { languageId },
  })

  const bibleCodes = data.bibleBooks.map((book) => ({
    name: book.name,
    metadataLanguageTag: "en",
    currentDescriptorLanguageId: "en",
    englishFullName: book.englishFullName.at(0)?.value ?? "",
    fullName: book.fullName.at(0)?.value ?? "",
  }))

  if (!readOnly) {
    db.write(() => {
      bibleCodes.forEach((bibleCode) => {
        db.create(BibleCode, bibleCode, Realm.UpdateMode.Modified)
      })
    })
  }

  return bibleCodes
}
```

### Data Flow

1. **API Fetch**: GraphQL queries fetch data from Jesus Film API
2. **Transformation**: Raw API data is transformed into Realm-compatible format
3. **Storage**: Transformed data is written to Realm database
4. **Logging**: Each step is logged with structured logging

## Key Concepts

### TransformOptions

All transformers accept a `TransformOptions` object:

```typescript
export type TransformOptions = {
  languageId: string      // Target language ID
  readOnly?: boolean      // Skip database writes if true
  logger: Logger          // Pino logger instance
}
```

### Error Handling

- All API calls are wrapped in try-catch blocks
- Database operations use Realm's transaction system
- Structured logging captures errors with context

### Logging

The application uses Pino for structured logging:

```typescript
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      singleLine: true,
    },
  },
}).child({
  service: "jfp-app-cache-builder",
})
```

## Schema Management

**Important**: Database schema changes do NOT originate from this repository. This tool is a data transformation and population utility that works with existing database schemas.

### Schema Change Process

1. **Schema changes must be implemented in the target applications first:**
   - **iOS App**: Update Realm schema in the iOS application
   - **Android App**: Update SQLite/Room schema in the Android application

2. **Database migration happens in the target applications:**
   - Run the iOS/Android apps with the new schema
   - Allow the database migration to complete
   - Verify the schema changes work correctly

3. **Prepare clean template files in this repository:**
   - Extract the migrated database files from the target applications
   - Replace the clean template files in this repository:
     - `assets/ios/arclight.clean.realm` (from iOS app)
     - `assets/android/arclight.clean.db` (from Android app)

4. **Rebuild from clean templates:**
   ```bash
   # Rebuild iOS database from clean template
   pnpm cli --target ios --rebuild
   
   # Rebuild Android database from clean template
   pnpm cli --target android --rebuild
   ```
   This cleans the template databases, removes all assets except .clean files, and copies the clean templates to create fresh databases.

5. **Update transformer code (if needed):**
   - Add/modify transformers to handle new data fields
   - Update GraphQL queries if new API fields are available
   - Test the transformation with the new schema

### Adding New Data Transformers

When new data types become available from the API, you can add transformers for them:

#### iOS Transformer

1. **Create schema directory:**
   ```bash
   mkdir src/ios/schema/[newType]
   ```

2. **Create GraphQL query** (`query.ts`):
   ```typescript
   import { graphql } from "gql.tada"

   export const JFPAppCacheBuilder_iOS_NewTypeQuery = graphql(`
     query JFPAppCacheBuilder_iOS_NewTypeQuery($languageId: ID!) {
       newTypes(languageId: $languageId) {
         # Define query fields
       }
     }
   `)
   ```

3. **Implement transformer** (`transform.ts`):
   ```typescript
   import { client } from "../../../lib/client.js"
   import { getDb } from "../../lib/db.js"
   import { JFPAppCacheBuilder_iOS_NewTypeQuery } from "./query.js"
   import type { TransformOptions } from "../../../types/transform.js"

   export async function transformNewTypes({
     languageId,
     readOnly = false,
     logger,
   }: TransformOptions) {
     const db = await getDb()
     // Transform API data and write to existing Realm schema
   }
   ```

#### Android Transformer

1. **Create schema directory:**
   ```bash
   mkdir src/android/schema/[newType]
   ```

2. **Create GraphQL query** (`query.ts`):
   ```typescript
   import { graphql } from "gql.tada"

   export const JFPAppCacheBuilder_Android_NewTypeQuery = graphql(`
     query JFPAppCacheBuilder_Android_NewTypeQuery($languageId: ID!) {
       newTypes(languageId: $languageId) {
         # Define query fields
       }
     }
   `)
   ```

3. **Implement transformer** (`transform.ts`):
   ```typescript
   import { client } from "../../../lib/client.js"
   import { db } from "../../lib/db.js"
   import { JFPAppCacheBuilder_Android_NewTypeQuery } from "./query.js"
   import type { TransformOptions } from "../../../types/transform.js"

   export async function transformNewTypes({
     languageId,
     readOnly = false,
     logger,
   }: TransformOptions) {
     // Transform API data and write to existing SQLite schema
   }
   ```

4. **Add to runner** (`src/ios/runner.ts` or `src/android/runner.ts`):
   ```typescript
   import { transformNewTypes } from "./schema/newType/transform.js"

   const transformers: [
     (options: TransformOptions) => Promise<any[]>,
     name: string,
   ][] = [
     // ... existing transformers
     [transformNewTypes, "newTypes"],
   ]
   ```

## CLI Usage

```bash
# Basic usage
pnpm cli --target ios --language-id "529" --language-tag "en"

# Rebuild from clean files
pnpm cli --target ios --rebuild
pnpm cli --target android --rebuild
```

### Options

- `--target`: Platform target (ios or android)
- `--language-id`: Language ID to process
- `--language-tag`: Language tag to process
- `--include-reading-language-data`: Include reading language data
- `--silent`: Run in silent mode
- `--verbose`: Run in verbose mode
- `--dry`: Run in dry-run mode

- `--rebuild`: Rebuild database from clean files (includes cleanup step)

### Database Files

#### iOS (Realm)
- Main database: `assets/ios/arclight.realm`
- Clean template: `assets/ios/arclight.clean.realm`
- Auxiliary files (removed during rebuild):
  - `arclight.realm.lock`
  - `arclight.realm.note`
  - `arclight.realm.management/`

#### Android (SQLite)
- Main database: `assets/android/arclight.db`
- Clean template: `assets/android/arclight.clean.db`
- Auxiliary files (removed during rebuild):
  - `arclight.db-shm` (shared memory file)
  - `arclight.db-wal` (write-ahead log)

## Testing

### Running Tests

```bash
pnpm test
```

### Test Structure

- Unit tests for individual transformers
- Integration tests for database operations
- API mock tests for GraphQL queries

## Performance Considerations

### Memory Management

- Large datasets are processed in chunks
- Database writes are batched
- Memory usage is monitored and logged

### API Rate Limiting

- Respect API rate limits
- Implement exponential backoff for retries
- Cache responses where appropriate

## Deployment

### Build Process

1. **TypeScript compilation:**
   ```bash
   pnpm build
   ```

2. **Production run:**
   ```bash
   pnpm start
   ```

### Environment Configuration

- `NODE_ENV`: Environment mode

## Troubleshooting

## Language Management

The application maintains a list of supported languages in `src/lib/languages.ts`. This file needs to be manually maintained and synchronized with the Jesus Film Project API.

### Language File Structure

```typescript
interface Language {
  tag: string          // BCP-47 language tag (e.g., "en", "es", "zh-Hans")
  name: string         // English name of the language
  nameNative: string   // Native name of the language
  id: number          // Jesus Film Project API language ID
}
```

### Updating Languages

1. **Source of Truth**: The language list should match the languages supported by the Jesus Film Project API. The source can be found at:
   ```
   https://github.com/JesusFilm/core/blob/main/apps/arclight/src/app/v2/%5B...route%5D/_metadata-language-tags/languages.ts
   ```

2. **Update Process**:
   - Compare the source file with our local `languages.ts`
   - Add/remove/modify languages as needed
   - Ensure all language IDs are correct
   - Test the changes with both iOS and Android builds

3. **Testing Language Updates**:
   ```bash
   # Test with a specific language
   pnpm cli --target ios --language-id "21028" --language-tag "es"
   pnpm cli --target android --language-id "21028" --language-tag "es"
   ```

### Common Development Issues

1. **TypeScript Errors**
   - Run `pnpm build` to check for type errors
   - Ensure all imports are properly typed

2. **GraphQL Schema Issues**
   - Check `gql.tada.config.ts` configuration
   - Verify API endpoint is accessible

3. **Database Issues**
   - **iOS (Realm)**:
     - Ensure database file is not locked
     - Check schema compatibility
     - Remove `.realm.lock`, `.realm.note`, and `.realm.management/` if needed
   - **Android (SQLite)**:
     - Check SQLite file permissions
     - Remove `.db-shm` and `.db-wal` files if needed
     - Verify Prisma schema matches database schema

### Debug Mode

The application uses structured logging with Pino. Logs include transformation progress, data counts, error details, and performance metrics.

## Contributing

### Code Style

- Follow ESLint and Prettier configurations
- Use TypeScript strict mode
- Write meaningful commit messages

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Run linting and formatting
4. Submit pull request with description

## Resources

- [Realm Documentation](https://docs.mongodb.com/realm/)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Pino Logging](https://getpino.io/) 