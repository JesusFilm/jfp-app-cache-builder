#!/usr/bin/env node
/* global process, console */

import { Command } from "commander"
import { Logger, pino } from "pino"

import { rebuild as androidRebuild } from "./android/lib/db.js"
import { runner as androidRunner } from "./android/runner.js"
import { rebuild as iosRebuild } from "./ios/lib/db.js"
import { runner as iosRunner } from "./ios/runner.js"
import { RunnerOptions } from "./types/transform.js"

const program = new Command()

program
  .name("jfp-app-cache-builder")
  .description(
    "Build and populate databases from Jesus Film Project API for iOS and Android applications"
  )
  .version("1.0.0")
  .requiredOption("-t, --target <target>", "Target platform (ios or android)")
  .option("--language-id <id>", "Language ID to process", "529")
  .option("--language-tag <tag>", "Language tag to process", "en")
  .option(
    "--include-reading-language-data",
    "Include reading language data in the build",
    false
  )
  .option("--silent", "Run in silent mode (no logging)", false)
  .option("--verbose", "Run in verbose mode (detailed logging)", false)
  .option("--dry", "Run in dry-run mode (no database changes)", false)

  .option(
    "-r, --rebuild",
    "Rebuild database from clean files (copy .clean.* files to target locations)",
    false
  )
  .parse()

interface CliOptions {
  target: string
  languageId: string
  languageTag: string
  includeReadingLanguageData: boolean
  silent: boolean
  verbose: boolean
  dry: boolean
  rebuild: boolean
}

const options = program.opts<CliOptions>()

// Validate target
if (!["ios", "android"].includes(options.target)) {
  console.error("Error: Target must be either 'ios' or 'android'")
  process.exit(1)
}

// Configure logger based on CLI options
let logger: Logger | undefined
if (!options.silent) {
  const logLevel = options.verbose ? "debug" : "info"
  logger = pino({
    level: logLevel,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        singleLine: true,
      },
    },
  }).child({
    service: "jfp-app-cache-builder",
    target: options.target,
  })
}

// If rebuild flag is provided, run only rebuild
if (options.rebuild) {
  logger?.info("Running rebuild only")

  if (options.target === "ios") {
    await iosRebuild({ logger })
  } else {
    await androidRebuild({ logger })
  }

  logger?.info("Rebuild completed successfully")
  process.exit(0)
}

const runnerOptions: RunnerOptions = {
  languageId: options.languageId,
  languageTag: options.languageTag,
  includeReadingLanguageData: options.includeReadingLanguageData,
  readOnly: options.dry,
  logger,
}

if (options.target === "ios") {
  await iosRunner(runnerOptions)
} else {
  await androidRunner(runnerOptions)
}

process.exit(0)
