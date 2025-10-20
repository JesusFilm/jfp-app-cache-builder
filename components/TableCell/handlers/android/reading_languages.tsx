import React from "react"

import { formatObject } from "../components"

export function handleReadingLanguagesColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    default:
      return formatObject(value)
  }
}
