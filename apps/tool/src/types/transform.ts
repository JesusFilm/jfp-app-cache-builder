import type { Logger } from "pino"

export type TransformOptions = {
  languageId: string
  languageTag: string
  readOnly?: boolean | undefined
  logger?: Logger | undefined
}

export interface RunnerOptions {
  languageId: string
  languageTag: string
  logger?: Logger | undefined
  includeReadingLanguageData?: boolean | undefined
  readOnly?: boolean | undefined
}
