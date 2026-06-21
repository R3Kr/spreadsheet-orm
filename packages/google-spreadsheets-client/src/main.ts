import { Brand, Context, Data, Effect, Layer, pipe } from "effect"
import {
  HttpBody,
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse
} from "effect/unstable/http"

export type SpreadsheetId = string & Brand.Brand<"SpreadsheetId">
export const SpreadsheetId = Brand.nominal<SpreadsheetId>()

export type A1Range = string & Brand.Brand<"A1Range">
export const A1Range = Brand.nominal<A1Range>()

export type MajorDimension = "ROWS" | "COLUMNS"
export type ValueRenderOption = "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA"
export type DateTimeRenderOption = "SERIAL_NUMBER" | "FORMATTED_STRING"
export type ValueInputOption = "RAW" | "USER_ENTERED"
export type InsertDataOption = "OVERWRITE" | "INSERT_ROWS"

export interface ValueRange {
  readonly range?: string
  readonly majorDimension?: MajorDimension
  readonly values?: ReadonlyArray<ReadonlyArray<unknown>>
}

export interface BatchGetValuesResponse {
  readonly spreadsheetId: string
  readonly valueRanges: ReadonlyArray<ValueRange>
}

export interface UpdateValuesResponse {
  readonly spreadsheetId: string
  readonly updatedRange: string
  readonly updatedRows: number
  readonly updatedColumns: number
  readonly updatedCells: number
  readonly updatedData?: ValueRange
}

export interface BatchUpdateValuesResponse {
  readonly spreadsheetId: string
  readonly totalUpdatedRows: number
  readonly totalUpdatedColumns: number
  readonly totalUpdatedCells: number
  readonly totalUpdatedSheets: number
  readonly responses: ReadonlyArray<UpdateValuesResponse>
}

export interface AppendValuesResponse {
  readonly spreadsheetId: string
  readonly tableRange: string
  readonly updates: UpdateValuesResponse
}

export interface ClearValuesResponse {
  readonly spreadsheetId: string
  readonly clearedRange: string
}

export interface Spreadsheet {
  readonly spreadsheetId: string
  readonly properties?: {
    readonly title?: string
    readonly locale?: string
    readonly autoRecalc?: string
    readonly timeZone?: string
    readonly defaultFormat?: unknown
    readonly iterativeCalculationSettings?: unknown
  }
  readonly sheets?: ReadonlyArray<unknown>
  readonly namedRanges?: ReadonlyArray<unknown>
  readonly spreadsheetUrl?: string
  readonly developerMetadata?: ReadonlyArray<unknown>
  readonly dataSources?: ReadonlyArray<unknown>
  readonly dataSourceSchedules?: ReadonlyArray<unknown>
}

export interface GoogleErrorPayload {
  readonly error?: {
    readonly code?: number
    readonly message?: string
    readonly status?: string
    readonly details?: ReadonlyArray<unknown>
    readonly errors?: ReadonlyArray<unknown>
  }
}

export type GoogleSheetsOperation =
  | "getSpreadsheet"
  | "getValues"
  | "batchGetValues"
  | "updateValues"
  | "batchUpdateValues"
  | "appendValues"
  | "clearValues"

export class GoogleSheetsAuthError extends Data.TaggedError("GoogleSheetsAuthError")<{
  readonly cause: unknown
}> {}

export class GoogleSheetsHttpError extends Data.TaggedError("GoogleSheetsHttpError")<{
  readonly operation: GoogleSheetsOperation
  readonly cause: HttpClientError.HttpClientError
}> {}

export class GoogleSheetsApiError extends Data.TaggedError("GoogleSheetsApiError")<{
  readonly operation: GoogleSheetsOperation
  readonly status: number
  readonly code: number | undefined
  readonly googleStatus: string | undefined
  readonly message: string | undefined
  readonly details: ReadonlyArray<unknown> | undefined
  readonly payload: unknown
}> {}

export class GoogleSheetsBodyError extends Data.TaggedError("GoogleSheetsBodyError")<{
  readonly operation: GoogleSheetsOperation
  readonly cause: unknown
}> {}

export type GoogleSheetsClientError =
  | GoogleSheetsAuthError
  | GoogleSheetsHttpError
  | GoogleSheetsApiError
  | GoogleSheetsBodyError

export interface GoogleSheetsAuth {
  readonly accessToken: Effect.Effect<string, GoogleSheetsAuthError>
}

export const GoogleSheetsAuth = Context.Service<GoogleSheetsAuth>(
  "spreadsheet-orm/GoogleSheetsAuth"
)

export interface GetSpreadsheetInput {
  readonly spreadsheetId: SpreadsheetId
  readonly fields?: string
  readonly includeGridData?: boolean
  readonly ranges?: ReadonlyArray<A1Range>
}

export interface GetValuesInput extends ReadOptions {
  readonly spreadsheetId: SpreadsheetId
  readonly range: A1Range
}

export interface BatchGetValuesInput extends ReadOptions {
  readonly spreadsheetId: SpreadsheetId
  readonly ranges: ReadonlyArray<A1Range>
}

export interface UpdateValuesInput extends WriteResponseOptions {
  readonly spreadsheetId: SpreadsheetId
  readonly range: A1Range
  readonly valueInputOption: ValueInputOption
  readonly valueRange: ValueRange
}

export interface BatchUpdateValuesInput extends WriteResponseOptions {
  readonly spreadsheetId: SpreadsheetId
  readonly valueInputOption: ValueInputOption
  readonly data: ReadonlyArray<ValueRange>
}

export interface AppendValuesInput extends WriteResponseOptions {
  readonly spreadsheetId: SpreadsheetId
  readonly range: A1Range
  readonly valueInputOption: ValueInputOption
  readonly valueRange: ValueRange
  readonly insertDataOption?: InsertDataOption
}

export interface ClearValuesInput {
  readonly spreadsheetId: SpreadsheetId
  readonly range: A1Range
}

export interface GoogleSheetsClient {
  readonly getSpreadsheet: (
    input: GetSpreadsheetInput
  ) => Effect.Effect<Spreadsheet, GoogleSheetsClientError>
  readonly getValues: (
    input: GetValuesInput
  ) => Effect.Effect<ValueRange, GoogleSheetsClientError>
  readonly batchGetValues: (
    input: BatchGetValuesInput
  ) => Effect.Effect<BatchGetValuesResponse, GoogleSheetsClientError>
  readonly updateValues: (
    input: UpdateValuesInput
  ) => Effect.Effect<UpdateValuesResponse, GoogleSheetsClientError>
  readonly batchUpdateValues: (
    input: BatchUpdateValuesInput
  ) => Effect.Effect<BatchUpdateValuesResponse, GoogleSheetsClientError>
  readonly appendValues: (
    input: AppendValuesInput
  ) => Effect.Effect<AppendValuesResponse, GoogleSheetsClientError>
  readonly clearValues: (
    input: ClearValuesInput
  ) => Effect.Effect<ClearValuesResponse, GoogleSheetsClientError>
}

export const GoogleSheetsClient = Context.Service<GoogleSheetsClient>(
  "spreadsheet-orm/GoogleSheetsClient"
)

export interface MakeGoogleSheetsClientOptions {
  readonly httpClient: HttpClient.HttpClient
  readonly auth: GoogleSheetsAuth
  readonly baseUrl?: string
}

interface ReadOptions {
  readonly majorDimension?: MajorDimension
  readonly valueRenderOption?: ValueRenderOption
  readonly dateTimeRenderOption?: DateTimeRenderOption
}

interface WriteResponseOptions {
  readonly includeValuesInResponse?: boolean
  readonly responseValueRenderOption?: ValueRenderOption
  readonly responseDateTimeRenderOption?: DateTimeRenderOption
}

const defaultBaseUrl = "https://sheets.googleapis.com"

export const makeGoogleSheetsClient = ({
  httpClient,
  auth,
  baseUrl = defaultBaseUrl
}: MakeGoogleSheetsClientOptions): GoogleSheetsClient => {
  const requestJson = <A>(
    operation: GoogleSheetsOperation,
    request: HttpClientRequest.HttpClientRequest
  ): Effect.Effect<A, GoogleSheetsClientError> =>
    pipe(
      auth.accessToken,
      Effect.flatMap((accessToken) =>
        httpClient.execute(HttpClientRequest.bearerToken(request, accessToken))
      ),
      Effect.mapError((cause) =>
        cause instanceof GoogleSheetsAuthError
          ? cause
          : new GoogleSheetsHttpError({
              operation,
              cause: cause as HttpClientError.HttpClientError
            })
      ),
      Effect.flatMap((response) => decodeJsonResponse<A>(operation, response))
    )

  const getSpreadsheet = (
    input: GetSpreadsheetInput
  ): Effect.Effect<Spreadsheet, GoogleSheetsClientError> =>
    requestJson(
      "getSpreadsheet",
      HttpClientRequest.get(url(baseUrl, `/v4/spreadsheets/${input.spreadsheetId}`, {
        fields: input.fields,
        includeGridData: input.includeGridData,
        ranges: input.ranges
      }))
    )

  const getValues = (
    input: GetValuesInput
  ): Effect.Effect<ValueRange, GoogleSheetsClientError> =>
    requestJson(
      "getValues",
      HttpClientRequest.get(
        url(baseUrl, `/v4/spreadsheets/${input.spreadsheetId}/values/${encodePath(input.range)}`, {
          majorDimension: input.majorDimension,
          valueRenderOption: input.valueRenderOption,
          dateTimeRenderOption: input.dateTimeRenderOption
        })
      )
    )

  const batchGetValues = (
    input: BatchGetValuesInput
  ): Effect.Effect<BatchGetValuesResponse, GoogleSheetsClientError> =>
    requestJson(
      "batchGetValues",
      HttpClientRequest.get(
        url(baseUrl, `/v4/spreadsheets/${input.spreadsheetId}/values:batchGet`, {
          ranges: input.ranges,
          majorDimension: input.majorDimension,
          valueRenderOption: input.valueRenderOption,
          dateTimeRenderOption: input.dateTimeRenderOption
        })
      )
    )

  const updateValues = (
    input: UpdateValuesInput
  ): Effect.Effect<UpdateValuesResponse, GoogleSheetsClientError> =>
    pipe(
      bodyJson("updateValues", input.valueRange),
      Effect.flatMap((body) =>
        requestJson(
          "updateValues",
          HttpClientRequest.put(
            url(baseUrl, `/v4/spreadsheets/${input.spreadsheetId}/values/${encodePath(input.range)}`, {
              valueInputOption: input.valueInputOption,
              includeValuesInResponse: input.includeValuesInResponse,
              responseValueRenderOption: input.responseValueRenderOption,
              responseDateTimeRenderOption: input.responseDateTimeRenderOption
            }),
            { body }
          )
        )
      )
    )

  const batchUpdateValues = (
    input: BatchUpdateValuesInput
  ): Effect.Effect<BatchUpdateValuesResponse, GoogleSheetsClientError> =>
    pipe(
      bodyJson("batchUpdateValues", {
        valueInputOption: input.valueInputOption,
        data: input.data,
        includeValuesInResponse: input.includeValuesInResponse,
        responseValueRenderOption: input.responseValueRenderOption,
        responseDateTimeRenderOption: input.responseDateTimeRenderOption
      }),
      Effect.flatMap((body) =>
        requestJson(
          "batchUpdateValues",
          HttpClientRequest.post(
            url(baseUrl, `/v4/spreadsheets/${input.spreadsheetId}/values:batchUpdate`),
            { body }
          )
        )
      )
    )

  const appendValues = (
    input: AppendValuesInput
  ): Effect.Effect<AppendValuesResponse, GoogleSheetsClientError> =>
    pipe(
      bodyJson("appendValues", input.valueRange),
      Effect.flatMap((body) =>
        requestJson(
          "appendValues",
          HttpClientRequest.post(
            url(baseUrl, `/v4/spreadsheets/${input.spreadsheetId}/values/${encodePath(input.range)}:append`, {
              valueInputOption: input.valueInputOption,
              insertDataOption: input.insertDataOption,
              includeValuesInResponse: input.includeValuesInResponse,
              responseValueRenderOption: input.responseValueRenderOption,
              responseDateTimeRenderOption: input.responseDateTimeRenderOption
            }),
            { body }
          )
        )
      )
    )

  const clearValues = (
    input: ClearValuesInput
  ): Effect.Effect<ClearValuesResponse, GoogleSheetsClientError> =>
    requestJson(
      "clearValues",
      HttpClientRequest.post(
        url(baseUrl, `/v4/spreadsheets/${input.spreadsheetId}/values/${encodePath(input.range)}:clear`)
      )
    )

  return {
    getSpreadsheet,
    getValues,
    batchGetValues,
    updateValues,
    batchUpdateValues,
    appendValues,
    clearValues
  }
}

export const layerGoogleSheetsClient = (options?: {
  readonly baseUrl?: string
}): Layer.Layer<GoogleSheetsClient, never, HttpClient.HttpClient | GoogleSheetsAuth> =>
  Layer.effect(
    GoogleSheetsClient,
    Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient
      const auth = yield* GoogleSheetsAuth

      return makeGoogleSheetsClient({
        httpClient,
        auth,
        ...(options?.baseUrl === undefined ? {} : { baseUrl: options.baseUrl })
      })
    })
  )

const bodyJson = (
  operation: GoogleSheetsOperation,
  body: unknown
): Effect.Effect<HttpBody.Uint8Array, GoogleSheetsBodyError> =>
  pipe(
    HttpBody.json(body),
    Effect.mapError(
      (cause) =>
        new GoogleSheetsBodyError({
          operation,
          cause
        })
    )
  )

const decodeJsonResponse = <A>(
  operation: GoogleSheetsOperation,
  response: HttpClientResponse.HttpClientResponse
): Effect.Effect<A, GoogleSheetsApiError | GoogleSheetsBodyError> => {
  if (response.status >= 200 && response.status < 300) {
    return pipe(
      response.json,
      Effect.map((payload) => payload as A),
      Effect.mapError(
        (cause) =>
          new GoogleSheetsBodyError({
            operation,
            cause
          })
      )
    )
  }

  return pipe(
    response.json,
    Effect.matchEffect({
      onFailure: () => Effect.fail(apiError(operation, response.status, undefined)),
      onSuccess: (payload) => Effect.fail(apiError(operation, response.status, payload))
    })
  )
}

const apiError = (
  operation: GoogleSheetsOperation,
  status: number,
  payload: unknown
): GoogleSheetsApiError => {
  const googleError = isGoogleErrorPayload(payload) ? payload.error : undefined

  return new GoogleSheetsApiError({
    operation,
    status,
    code: googleError?.code,
    googleStatus: googleError?.status,
    message: googleError?.message,
    details: googleError?.details,
    payload
  })
}

const isGoogleErrorPayload = (value: unknown): value is GoogleErrorPayload =>
  typeof value === "object" &&
  value !== null &&
  "error" in value &&
  typeof (value as { readonly error?: unknown }).error === "object" &&
  (value as { readonly error?: unknown }).error !== null

const encodePath = (value: string): string => encodeURIComponent(value)

const url = (
  baseUrl: string,
  pathname: string,
  query?: Readonly<Record<string, QueryValue>>
): URL => {
  const value = new URL(pathname, normalizedBaseUrl(baseUrl))

  if (query !== undefined) {
    for (const [key, queryValue] of Object.entries(query)) {
      appendQueryParam(value, key, queryValue)
    }
  }

  return value
}

type QueryValue =
  | string
  | number
  | boolean
  | ReadonlyArray<string | number | boolean>
  | undefined

const appendQueryParam = (url: URL, key: string, value: QueryValue): void => {
  if (value === undefined) {
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      url.searchParams.append(key, String(item))
    }
    return
  }

  url.searchParams.set(key, String(value))
}

const normalizedBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
