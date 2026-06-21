import { Context, Data, Effect, Layer, Schema, pipe } from "effect"
import {
  A1Range,
  GoogleSheetsClient,
  type GoogleSheetsClientError,
  type SpreadsheetId
} from "google-spreadsheets-client"

export type StructTableSchema = Schema.Struct<Schema.Struct.Fields>

const TableDefinitionTypeId: unique symbol = Symbol("spreadsheet-orm/TableDefinition")

export interface TableDefinition<S extends StructTableSchema> {
  readonly [TableDefinitionTypeId]: typeof TableDefinitionTypeId
  readonly debugName: string
  readonly schema: S
  readonly columnNames: ReadonlyArray<string>
}

export type AnyTableDefinition = TableDefinition<StructTableSchema>

export type TableRow<T extends AnyTableDefinition> = T["schema"]["Type"]

export type TableDecodingServices<T extends AnyTableDefinition> =
  T["schema"]["DecodingServices"]

export interface TableBinding<T extends AnyTableDefinition> {
  readonly table: T
  readonly spreadsheetId: SpreadsheetId
  readonly range: A1Range
  readonly startColumn: string
  readonly startRow: number
}

export type AnyTableBinding = TableBinding<AnyTableDefinition>

export interface TableRegistry {
  readonly bindings: ReadonlyMap<AnyTableDefinition, AnyTableBinding>
}

export interface TableLocation {
  readonly tableDebugName: string
  readonly spreadsheetId: SpreadsheetId
  readonly range: A1Range
}

export class InvalidTableDefinition extends Data.TaggedError(
  "InvalidTableDefinition"
)<{
  readonly debugName: string
  readonly reason: string
}> {}

export class InvalidBoundTableRange extends Data.TaggedError(
  "InvalidBoundTableRange"
)<{
  readonly tableDebugName: string
  readonly spreadsheetId: SpreadsheetId
  readonly range: A1Range
  readonly reason: string
}> {}

export class DuplicateTableBinding extends Data.TaggedError(
  "DuplicateTableBinding"
)<{
  readonly tableDebugName: string
}> {}

export class DuplicateTableLocation extends Data.TaggedError(
  "DuplicateTableLocation"
)<{
  readonly spreadsheetId: SpreadsheetId
  readonly range: A1Range
  readonly firstTableDebugName: string
  readonly duplicateTableDebugName: string
}> {}

export class UnboundTable extends Data.TaggedError("UnboundTable")<{
  readonly tableDebugName: string
}> {}

export class TableReadFailure extends Data.TaggedError("TableReadFailure")<{
  readonly location: TableLocation
  readonly cause: GoogleSheetsClientError
}> {}

export class MissingColumns extends Data.TaggedError("MissingColumns")<{
  readonly location: TableLocation
  readonly columns: ReadonlyArray<string>
}> {}

export class DuplicateColumns extends Data.TaggedError("DuplicateColumns")<{
  readonly location: TableLocation
  readonly columns: ReadonlyArray<string>
}> {}

export class InvalidRow extends Data.TaggedError("InvalidRow")<{
  readonly location: TableLocation
  readonly spreadsheetRowNumber: number
  readonly row: Readonly<Record<string, unknown>>
  readonly cause: Schema.SchemaError
}> {}

export type TableRegistryError =
  | DuplicateTableBinding
  | DuplicateTableLocation

export type SpreadsheetOrmQueryError =
  | UnboundTable
  | TableReadFailure
  | MissingColumns
  | DuplicateColumns
  | InvalidRow

export interface SpreadsheetOrm {
  readonly findAll: <T extends AnyTableDefinition>(
    table: T
  ) => Effect.Effect<
    ReadonlyArray<TableRow<T>>,
    SpreadsheetOrmQueryError,
    TableDecodingServices<T>
  >
}

export const SpreadsheetOrm = Context.Service<SpreadsheetOrm>(
  "spreadsheet-orm/SpreadsheetOrm"
)

export interface MakeSpreadsheetOrmOptions {
  readonly googleSheetsClient: GoogleSheetsClient
  readonly registry: TableRegistry
}

export const defineTable = <S extends StructTableSchema>(
  debugName: string,
  schema: S
): TableDefinition<S> => {
  if (debugName.trim() === "") {
    throw new InvalidTableDefinition({
      debugName,
      reason: "Table debug name must not be empty"
    })
  }

  if (!isStructTableSchema(schema)) {
    throw new InvalidTableDefinition({
      debugName,
      reason: "Table schema must be a top-level struct schema"
    })
  }

  const fieldKeys = Reflect.ownKeys(schema.fields)
  const nonStringKeys = fieldKeys.filter((key) => typeof key !== "string")

  if (nonStringKeys.length > 0) {
    throw new InvalidTableDefinition({
      debugName,
      reason: "Table schema fields must use string property keys"
    })
  }

  const table: TableDefinition<S> = {
    [TableDefinitionTypeId]: TableDefinitionTypeId,
    debugName,
    schema,
    columnNames: Object.freeze(fieldKeys as ReadonlyArray<string>)
  }

  return Object.freeze(table)
}

export const bindTable = <T extends AnyTableDefinition>(
  table: T,
  input: {
    readonly spreadsheetId: SpreadsheetId
    readonly range: A1Range
  }
): Effect.Effect<TableBinding<T>, InvalidBoundTableRange> => {
  const startCell = parseStartCell(input.range)

  if (startCell === undefined) {
    return Effect.fail(
      new InvalidBoundTableRange({
        tableDebugName: table.debugName,
        spreadsheetId: input.spreadsheetId,
        range: input.range,
        reason: "Bound table range must start at an explicit cell such as A1 or B5"
      })
    )
  }

  return Effect.succeed({
    table,
    spreadsheetId: input.spreadsheetId,
    range: input.range,
    startColumn: startCell.column,
    startRow: startCell.row
  })
}

export const makeTableRegistry = (
  bindings: Iterable<AnyTableBinding>
): Effect.Effect<TableRegistry, TableRegistryError> =>
  Effect.gen(function* () {
    const byTable = new Map<AnyTableDefinition, AnyTableBinding>()
    const byLocation = new Map<string, AnyTableBinding>()

    for (const binding of bindings) {
      if (byTable.has(binding.table)) {
        return yield* Effect.fail(
          new DuplicateTableBinding({
            tableDebugName: binding.table.debugName
          })
        )
      }

      const locationKey = bindingLocationKey(binding)
      const previous = byLocation.get(locationKey)

      if (previous !== undefined) {
        return yield* Effect.fail(
          new DuplicateTableLocation({
            spreadsheetId: binding.spreadsheetId,
            range: binding.range,
            firstTableDebugName: previous.table.debugName,
            duplicateTableDebugName: binding.table.debugName
          })
        )
      }

      byTable.set(binding.table, binding)
      byLocation.set(locationKey, binding)
    }

    return {
      bindings: byTable
    }
  })

export const makeSpreadsheetOrm = ({
  googleSheetsClient,
  registry
}: MakeSpreadsheetOrmOptions): SpreadsheetOrm => {
  const findAll = <T extends AnyTableDefinition>(
    table: T
  ): Effect.Effect<
    ReadonlyArray<TableRow<T>>,
    SpreadsheetOrmQueryError,
    TableDecodingServices<T>
  > => {
    const binding = registry.bindings.get(table)

    if (binding === undefined) {
      return Effect.fail(
        new UnboundTable({
          tableDebugName: table.debugName
        })
      )
    }

    const typedBinding = binding as TableBinding<T>
    const location = tableLocation(typedBinding)

    return pipe(
      googleSheetsClient.getValues({
        spreadsheetId: typedBinding.spreadsheetId,
        range: typedBinding.range,
        valueRenderOption: "UNFORMATTED_VALUE"
      }),
      Effect.mapError(
        (cause) =>
          new TableReadFailure({
            location,
            cause
          })
      ),
      Effect.flatMap((valueRange) =>
        decodeTableValues(typedBinding, valueRange.values ?? [])
      )
    )
  }

  return {
    findAll
  }
}

export const layerSpreadsheetOrm = (
  registry: TableRegistry
): Layer.Layer<SpreadsheetOrm, never, GoogleSheetsClient> =>
  Layer.effect(
    SpreadsheetOrm,
    Effect.gen(function* () {
      const googleSheetsClient = yield* GoogleSheetsClient

      return makeSpreadsheetOrm({
        googleSheetsClient,
        registry
      })
    })
  )

const decodeTableValues = <T extends AnyTableDefinition>(
  binding: TableBinding<T>,
  values: ReadonlyArray<ReadonlyArray<unknown>>
): Effect.Effect<
  ReadonlyArray<TableRow<T>>,
  MissingColumns | DuplicateColumns | InvalidRow,
  TableDecodingServices<T>
> => {
  const location = tableLocation(binding)
  const headerRow = values[0] ?? []
  const header = parseHeader(headerRow)
  const duplicateColumns = duplicateValues(header.columnNames)

  if (duplicateColumns.length > 0) {
    return Effect.fail(
      new DuplicateColumns({
        location,
        columns: duplicateColumns
      })
    )
  }

  const missingColumns = binding.table.columnNames.filter(
    (columnName) => !header.columnIndexes.has(columnName)
  )

  if (missingColumns.length > 0) {
    return Effect.fail(
      new MissingColumns({
        location,
        columns: missingColumns
      })
    )
  }

  const dataRows = values
    .slice(1)
    .map((row, index) => ({
      row,
      spreadsheetRowNumber: binding.startRow + index + 1
    }))
    .filter(({ row }) => !isEmptyRow(row))

  return Effect.forEach(dataRows, ({ row, spreadsheetRowNumber }) => {
    const rowObject = rowObjectFromCells(binding.table.columnNames, header, row)

    return pipe(
      Schema.decodeUnknownEffect(binding.table.schema)(rowObject),
      Effect.mapError(
        (cause) =>
          new InvalidRow({
            location,
            spreadsheetRowNumber,
            row: rowObject,
            cause
          })
      )
    )
  })
}

interface Header {
  readonly columnNames: ReadonlyArray<string>
  readonly columnIndexes: ReadonlyMap<string, number>
}

const parseHeader = (row: ReadonlyArray<unknown>): Header => {
  const columnNames: Array<string> = []
  const columnIndexes = new Map<string, number>()

  for (let index = 0; index < row.length; index++) {
    const value = row[index]

    if (isEmptyCell(value)) {
      continue
    }

    const columnName = String(value)
    columnNames.push(columnName)

    if (!columnIndexes.has(columnName)) {
      columnIndexes.set(columnName, index)
    }
  }

  return {
    columnNames,
    columnIndexes
  }
}

const duplicateValues = (
  values: ReadonlyArray<string>
): ReadonlyArray<string> => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
      continue
    }

    seen.add(value)
  }

  return Array.from(duplicates)
}

const rowObjectFromCells = (
  columnNames: ReadonlyArray<string>,
  header: Header,
  row: ReadonlyArray<unknown>
): Readonly<Record<string, unknown>> => {
  const object: Record<string, unknown> = {}

  for (const columnName of columnNames) {
    const columnIndex = header.columnIndexes.get(columnName)

    if (columnIndex === undefined) {
      continue
    }

    const value = row[columnIndex]

    if (isEmptyCell(value)) {
      continue
    }

    object[columnName] = value
  }

  return object
}

const isEmptyRow = (row: ReadonlyArray<unknown>): boolean =>
  row.every(isEmptyCell)

const isEmptyCell = (value: unknown): boolean =>
  value === undefined || value === null || value === ""

const tableLocation = (binding: AnyTableBinding): TableLocation => ({
  tableDebugName: binding.table.debugName,
  spreadsheetId: binding.spreadsheetId,
  range: binding.range
})

const bindingLocationKey = (binding: AnyTableBinding): string =>
  `${binding.spreadsheetId}\u0000${binding.range}`

interface StartCell {
  readonly column: string
  readonly row: number
}

const parseStartCell = (range: A1Range): StartCell | undefined => {
  const rangePart = String(range).slice(String(range).lastIndexOf("!") + 1)
  const match = /^\$?([A-Za-z]+)\$?([1-9][0-9]*)(?::|$)/.exec(rangePart)

  if (match === null) {
    return undefined
  }

  return {
    column: match[1].toUpperCase(),
    row: Number(match[2])
  }
}

const isStructTableSchema = (schema: unknown): schema is StructTableSchema =>
  typeof schema === "object" &&
  schema !== null &&
  "fields" in schema &&
  typeof (schema as { readonly fields?: unknown }).fields === "object" &&
  (schema as { readonly fields?: unknown }).fields !== null

export { A1Range }
