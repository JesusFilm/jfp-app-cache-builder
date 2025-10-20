# JFP App Cache Builder

A data transformation tool that fetches content from the Jesus Film API and builds local databases for offline use in iOS and Android applications.

## What is JFP App Cache Builder?

JFP App Cache Builder is a Node.js application that:

- Connects to the Jesus Film API Gateway (`https://api-gateway.central.jesusfilm.org`)
- Fetches various types of content data (languages, media items, countries, etc.)
- Transforms the data into a structured format
- Stores it in a local database file:
  - iOS: Realm database (`apps/tool/assets/ios/cache.realm`)
  - Android: SQLite database (`apps/tool/assets/android/cache.db`)

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
   pnpm build:tool
   ```

3. **Run the data transformation:**

   ```bash
   # Using the CLI binary for iOS
   ./apps/tool/bin/jfp-app-cache-builder --target ios

   # Using the CLI binary for Android
   ./apps/tool/bin/jfp-app-cache-builder --target android

   # Or using pnpm scripts
   pnpm dev:tool -- --target ios
   ```

This will:

- Fetch data from the Jesus Film API
- Transform it into the required format
- Save it to the appropriate database file based on the target

## Command Line Interface

JFP App Cache Builder includes a powerful CLI with the following options:

```bash
./apps/tool/bin/jfp-app-cache-builder [options]
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
./apps/tool/bin/jfp-app-cache-builder --target ios

# Android build (English, language ID 529)
./apps/tool/bin/jfp-app-cache-builder --target android

# iOS build for Spanish
./apps/tool/bin/jfp-app-cache-builder --target ios --language-id 496 --language-tag es

# Android build with reading language data included
./apps/tool/bin/jfp-app-cache-builder --target android --include-reading-language-data

# iOS build with verbose logging
./apps/tool/bin/jfp-app-cache-builder --target ios --verbose

# Android build in silent mode
./apps/tool/bin/jfp-app-cache-builder --target android --silent
```

## Available Scripts

### Tool (CLI Application)

- `pnpm build:tool` - Build the TypeScript code
- `pnpm dev:tool` - Run the transformation in development mode
- `pnpm start` - Run the built application
- `pnpm cli` - Build and run the CLI binary
- `pnpm test:tool` - Run the test suite for the tool
- `pnpm export:dbs` - Export database contents to JSON files

### Website (Database Browser)

- `pnpm build:website` - Build the Next.js site for production
- `pnpm dev:website` - Start the development server
- `pnpm start:website` - Start the production server
- `pnpm test:website` - Run tests for the website

### Workspace Commands

- `pnpm build` - Build all applications
- `pnpm test` - Run all tests
- `pnpm lint` - Check code for linting issues across all apps
- `pnpm lint:fix` - Fix linting issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check if code is properly formatted

## Project Structure

This is an Nx monorepo with two applications:

```
apps/
├── tool/           # CLI tool for building databases
│   ├── src/        # Source code
│   ├── assets/     # Database files
│   ├── prisma/     # Database schema
│   ├── scripts/    # Export scripts
│   └── bin/        # CLI binary
└── website/        # Next.js database browser
    ├── app/        # Next.js app directory
    ├── components/ # React components
    └── public/     # Static assets
```

## CI/CD

This project uses GitHub Actions for continuous integration and deployment:

### CI Workflow (`ci.yml`)

Runs on every push to `main` and pull request:

- **Code Formatting**: Checks if code follows Prettier formatting standards
- **Linting**: Runs ESLint to check for code quality issues
- **Build**: Compiles TypeScript and generates build artifacts
- **Testing**: Runs the complete test suite
- **Artifact Verification**: Ensures build artifacts are created correctly

### Build Workflow (`build.yml`)

Runs on pushes to `main` and manual triggers:

- **iOS Cache Build**: Generates iOS Realm database with all content
- **Android Cache Build**: Generates Android SQLite database with all content
- **Artifact Upload**: Uploads cache files as GitHub artifacts

### Workflow Status

- ✅ **CI**: All checks must pass before cache builds
- ✅ **Build**: Cache builds only run if CI passes
- ✅ **Parallel**: iOS and Android builds run in parallel
- ✅ **Caching**: Uses pnpm and Node.js caching for faster builds

## Output

The tool generates database files containing:

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
- **Database Path**: `apps/tool/assets/cache.realm` (iOS) or `apps/tool/assets/cache.db` (Android)

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure you have network access to `https://api-gateway.central.jesusfilm.org`
   - Check if the API is available and responding

2. **Database Write Errors**
   - Ensure the `apps/tool/assets/` directory exists and is writable
   - Check if the database file is not locked by another process

3. **Memory Issues**
   - The tool processes large amounts of data; ensure sufficient RAM is available
   - Consider running with `--max-old-space-size=4096` if needed

### Logs

The application uses structured logging with Pino. Logs include:

- Transformation progress
- Data counts
- Error details
- Performance metrics

## Database Browser

The project includes a Next.js web application for browsing the generated database contents:

### Features

- **Interactive Database Browser**: Explore Android SQLite and iOS Realm database contents
- **Table/Schema Navigation**: Left sidebar with all available tables and schemas
- **Data Visualization**: Responsive table view with search and pagination
- **Binary Data Handling**: Special handling for iOS Realm Buffer fields with download functionality
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS

### Accessing the Database Browser

The database browser is automatically deployed to GitHub Pages when the build workflow runs. You can access it at your GitHub Pages URL.

### Local Development

To run the database browser locally:

1. **Build the databases first:**

   ```bash
   pnpm build:tool
   ./apps/tool/bin/jfp-app-cache-builder --target ios
   ./apps/tool/bin/jfp-app-cache-builder --target android
   ```

2. **Export database data:**

   ```bash
   pnpm export:dbs
   ```

3. **Start the development server:**

   ```bash
   pnpm dev:website
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Database Export

The database browser uses pre-processed JSON files generated at build time:

- **Android Data**: `apps/website/public/data/android/` - Contains all SQLite table data
- **iOS Data**: `apps/website/public/data/ios/` - Contains all Realm schema data

These files are automatically generated by the export scripts and included in the GitHub Pages deployment.

## Support

For issues or questions:

1. Check the logs for error details
2. Ensure all prerequisites are met
3. Verify API access and network connectivity
4. Contact the development team for additional support
