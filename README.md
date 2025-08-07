# JFP App Cache Builder

A data transformation tool that fetches content from the Jesus Film API and builds local databases for offline use in iOS and Android applications.

## What is JFP App Cache Builder?

JFP App Cache Builder is a Node.js application that:

- Connects to the Jesus Film API Gateway (`https://api-gateway.central.jesusfilm.org`)
- Fetches various types of content data (languages, media items, countries, etc.)
- Transforms the data into a structured format
- Stores it in a local database file:
  - iOS: Realm database (`assets/ios/arclight.realm`)
  - Android: SQLite database (`assets/android/arclight.db`)

This database can then be used by iOS and Android applications to provide offline access to Jesus Film content.

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Access to the Jesus Film API Gateway

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the application:**
   ```bash
   pnpm build
   ```

3. **Run the data transformation:**
   ```bash
   # Using the CLI binary for iOS
   ./bin/jfp-app-cache-builder --target ios
   
   # Using the CLI binary for Android
   ./bin/jfp-app-cache-builder --target android
   
   # Or using pnpm scripts
   pnpm dev -- --target ios
   ```

This will:
- Fetch data from the Jesus Film API
- Transform it into the required format
- Save it to the appropriate database file based on the target

## Command Line Interface

JFP App Cache Builder includes a powerful CLI with the following options:

```bash
./bin/jfp-app-cache-builder [options]
```

### Options

- `--target <target>` - Target platform (required: "ios" or "android")
- `-l, --language-id <id>` - Language ID to process (default: "529")
- `-t, --language-tag <tag>` - Language tag to process (default: "en")
- `--include-reading-language-data` - Include reading language data in the build
- `--silent` - Run in silent mode (no logging)
- `--verbose` - Run in verbose mode (detailed logging)
- `-V, --version` - Output the version number
- `-h, --help` - Display help for command

### Examples

```bash
# iOS build (English, language ID 529)
./bin/jfp-app-cache-builder --target ios

# Android build (English, language ID 529)
./bin/jfp-app-cache-builder --target android

# iOS build for Spanish
./bin/jfp-app-cache-builder --target ios --language-id 496 --language-tag es

# Android build with reading language data included
./bin/jfp-app-cache-builder --target android --include-reading-language-data

# iOS build with verbose logging
./bin/jfp-app-cache-builder --target ios --verbose

# Android build in silent mode
./bin/jfp-app-cache-builder --target android --silent
```

## Available Scripts

- `pnpm dev` - Run the transformation in development mode
- `pnpm build` - Build the TypeScript code
- `pnpm start` - Run the built application
- `pnpm cli` - Build and run the CLI binary
- `pnpm lint` - Check code for linting issues
- `pnpm lint:fix` - Fix linting issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check if code is properly formatted

## Output

The tool generates a Realm database file at `assets/arclight.realm` containing:

- **Bible Codes** - Bible book information and metadata
- **Languages** - Language data with audio previews and speaker counts
- **Countries** - Country information and relationships
- **Media Items** - Video content with descriptions, images, and metadata
- **Media Categories** - Content categorization
- **Reading Language Data** - Language-specific content bundles
- **Suggested Languages** - Recommended languages for different regions

## Configuration

The tool uses the following default configuration:

- **Language ID**: `529` (English)
- **API Endpoint**: `https://api-gateway.central.jesusfilm.org`
- **Database Path**: `assets/arclight.realm`

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure you have network access to `https://api-gateway.central.jesusfilm.org`
   - Check if the API is available and responding

2. **Database Write Errors**
   - Ensure the `assets/` directory exists and is writable
   - Check if the Realm database file is not locked by another process

3. **Memory Issues**
   - The tool processes large amounts of data; ensure sufficient RAM is available
   - Consider running with `--max-old-space-size=4096` if needed

### Logs

The application uses structured logging with Pino. Logs include:
- Transformation progress
- Data counts
- Error details
- Performance metrics

## Support

For issues or questions:
1. Check the logs for error details
2. Ensure all prerequisites are met
3. Verify API access and network connectivity
4. Contact the development team for additional support 