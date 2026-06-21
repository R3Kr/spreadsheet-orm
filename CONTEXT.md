# Spreadsheet ORM

This context provides an Effect-based integration boundary for Google Sheets so spreadsheet data can later be used by higher-level ORM concepts.

## Language

**GoogleSheetsClient**:
A low-level integration service for calling the Google Sheets API.
_Avoid_: Spreadsheet ORM, ORM gateway, Drive client

**GoogleSheetsAuth**:
A provider of Google API access tokens for the Google Sheets integration.
_Avoid_: OAuth client, service account manager, raw token

**GoogleSheetsClient Factory**:
A direct constructor for a Google Sheets client instance used in tests or custom wiring.
_Avoid_: Authentication factory, ORM factory, test helper

**Spreadsheet Values**:
The cell value ranges read from or written to a Google spreadsheet.
_Avoid_: Rows, records, entities

**A1 Range**:
A Google Sheets range expressed in A1 notation.
_Avoid_: Range builder, table range, entity range

**Spreadsheet ID**:
The Google identifier of a spreadsheet.
_Avoid_: File ID, table ID, workbook ID

**Google Sheets Payload**:
A request or response body shaped like the Google Sheets API contract.
_Avoid_: ORM DTO, entity DTO, row model

**Google Sheets Error Payload**:
The error response body returned by the Google Sheets API when a request is not successful.
_Avoid_: Success payload schema, ORM validation error

**Google Sheets Option**:
A query or body option defined by the Google Sheets API for a specific operation.
_Avoid_: Client default, ORM option

**Value Input Choice**:
The caller's decision about how Google Sheets should interpret written values.
_Avoid_: Hidden write default, render option

**Google Sheets API Failure**:
A non-success response returned by the Google Sheets API.
_Avoid_: Transport failure, auth failure

## Relationships

- The **GoogleSheetsClient** is a dependency of future spreadsheet ORM abstractions, not the ORM abstraction itself.
- The **GoogleSheetsClient** depends on **GoogleSheetsAuth** for access tokens and does not own Google authentication flows.
- The **GoogleSheetsClient** is scope-agnostic; **GoogleSheetsAuth** and application configuration own OAuth scope choices.
- The **GoogleSheetsClient** can be provided through Effect layer composition or a **GoogleSheetsClient Factory**.
- The **GoogleSheetsClient Factory** is the initial test seam; dedicated test helpers are deferred until repeated test patterns emerge.
- The **GoogleSheetsClient** is limited to the Google Sheets API; Drive file discovery, permissions, folders, and sharing belong outside this client.
- The first **GoogleSheetsClient** surface follows Google Sheets REST resources for existing spreadsheet **Spreadsheet Values** and minimal spreadsheet metadata.
- The **GoogleSheetsClient** accepts **A1 Range** strings and owns safe URL construction, not structured range modeling.
- **Spreadsheet ID** and **A1 Range** values are distinct even though both are represented as strings at the API boundary.
- The **GoogleSheetsClient** preserves **Google Sheets Payload** shapes; project-specific mapping belongs above it.
- The **GoogleSheetsClient** trusts successful **Google Sheets Payload** shapes after parsing and only inspects **Google Sheets Error Payload** enough to classify failures.
- The **GoogleSheetsClient** exposes relevant **Google Sheets Option** names instead of hiding them behind client-specific defaults.
- The **GoogleSheetsClient** methods use named inputs so Google identifiers, **A1 Ranges**, and **Google Sheets Options** stay explicit at call sites.
- Write operations require an explicit **Value Input Choice**.
- A **Google Sheets API Failure** is distinct from token provider failures and HTTP transport failures.
- The **GoogleSheetsClient** does not own retry or timeout policy; callers choose operational policy based on operation semantics.

## Example Dialogue

> **Dev:** "Should the **GoogleSheetsClient** know what a model or table is?"
> **Domain expert:** "No — it should call Google Sheets; ORM concepts belong in a layer above it."
>
> **Dev:** "Should the **GoogleSheetsClient** refresh OAuth tokens?"
> **Domain expert:** "No — **GoogleSheetsAuth** supplies usable access tokens."
>
> **Dev:** "Should the **GoogleSheetsClient** request read/write scopes?"
> **Domain expert:** "No — **GoogleSheetsAuth** and application configuration decide scopes."
>
> **Dev:** "Do all tests need a full Effect layer graph?"
> **Domain expert:** "No — tests may use a **GoogleSheetsClient Factory** when direct wiring is clearer."
>
> **Dev:** "Should the package publish test helpers immediately?"
> **Domain expert:** "No — use the **GoogleSheetsClient Factory** first and add helpers only after test patterns repeat."
>
> **Dev:** "Should the **GoogleSheetsClient** find spreadsheets in Drive folders?"
> **Domain expert:** "No — Drive file management belongs in a separate boundary."
>
> **Dev:** "Should the first **GoogleSheetsClient** slice create new spreadsheets?"
> **Domain expert:** "No — the first slice works with existing spreadsheets; spreadsheet creation can be added later."
>
> **Dev:** "Should the **GoogleSheetsClient** expose `findRows` or `saveEntity`?"
> **Domain expert:** "No — those are ORM concepts; the client exposes value and spreadsheet operations."
>
> **Dev:** "Should the **GoogleSheetsClient** build table ranges?"
> **Domain expert:** "No — callers pass an **A1 Range**; structured range construction belongs above the client."
>
> **Dev:** "Can a spreadsheet identifier and range be swapped?"
> **Domain expert:** "No — **Spreadsheet ID** and **A1 Range** are distinct concepts even though Google receives both as strings."
>
> **Dev:** "Should `getValues` return our entity records?"
> **Domain expert:** "No — it returns a **Google Sheets Payload**; entity mapping belongs above the client."
>
> **Dev:** "Should every successful response be schema-validated?"
> **Domain expert:** "No — successful **Google Sheets Payloads** are trusted after parsing; **Google Sheets Error Payloads** are inspected for failure classification."
>
> **Dev:** "Should `getValues` invent a default rendering mode?"
> **Domain expert:** "No — rendering choices are **Google Sheets Options**; unset options use Google API defaults."
>
> **Dev:** "Should spreadsheet metadata reads require a fields mask?"
> **Domain expert:** "No — `fields` is an optional **Google Sheets Option** for callers that want smaller responses."
>
> **Dev:** "Should `getValues` take positional arguments?"
> **Domain expert:** "No — method inputs are named so identifiers, ranges, and options remain explicit."
>
> **Dev:** "Should writes default to raw values?"
> **Domain expert:** "No — each write needs an explicit **Value Input Choice** because Google can interpret formulas, dates, and numbers differently."
>
> **Dev:** "Should every failed request be called a Google Sheets API failure?"
> **Domain expert:** "No — only a non-success Google response is a **Google Sheets API Failure**; token and transport failures are separate."
>
> **Dev:** "Should `appendValues` retry automatically?"
> **Domain expert:** "No — callers decide retry policy because appends and reads have different duplication risks."
>
> **Dev:** "Should each method take a timeout option?"
> **Domain expert:** "No — callers use Effect timeout and interruption policies around the client call."

## Flagged Ambiguities

- "effect service" was resolved as **GoogleSheetsClient**, a low-level Effect service for the Google Sheets API rather than a higher-level spreadsheet ORM gateway.
- "authentication" was resolved as **GoogleSheetsAuth**, a token provider dependency rather than authentication logic inside **GoogleSheetsClient**.
- "spreadsheet reads and writes" was resolved as **Spreadsheet Values** at this layer, not rows, records, or entities.
- "range" was resolved as **A1 Range** strings at this layer, not structured table or entity ranges.
- "DTO" was resolved as **Google Sheets Payload** at this layer, not a project-specific transfer object.
- "response validation" was resolved as lightweight error payload inspection, not full success payload validation.
- "options" was resolved as **Google Sheets Option** names from the API, not client-specific defaults.
- "write value mode" was resolved as **Value Input Choice**, an explicit caller decision for write operations.
- "Google API error" was resolved as **Google Sheets API Failure**, distinct from authentication and transport failures.
