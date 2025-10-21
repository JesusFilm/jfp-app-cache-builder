import androidSchema from "./data/schema.json"

export interface TableColumn {
  name: string
  type: string
  notnull: boolean
  dflt_value: any
  pk: boolean
}

export interface TableInfo {
  name: string
  columns: TableColumn[]
  rowCount: number
}

export interface AndroidSchema {
  tables: TableInfo[]
}

export const androidSchemaData: AndroidSchema = androidSchema as AndroidSchema
