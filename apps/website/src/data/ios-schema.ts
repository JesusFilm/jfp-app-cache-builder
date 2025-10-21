import iosSchema from "../../public/data/ios/schema.json"

export interface SchemaProperty {
  name: string
  type: string
  optional: boolean
  primaryKey?: boolean
}

export interface SchemaInfo {
  name: string
  properties: SchemaProperty[]
  objectCount: number
}

export interface IOSSchema {
  schemas: SchemaInfo[]
}

export const iosSchemaData: IOSSchema = iosSchema as IOSSchema
