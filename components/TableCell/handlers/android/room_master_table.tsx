import React from "react"
import { formatObject } from "../components"

export function handleRoomMasterTableColumn(
  columnName: string,
  value: any
): React.ReactNode | string {
  switch (columnName) {
    default:
      return formatObject(value)
  }
}
