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

**Table Schema**:
An Effect Schema that defines the typed shape of one logical spreadsheet row.
_Avoid_: Spreadsheet table, sheet binding, model class

**Struct Table Schema**:
A Table Schema whose top-level shape is an object keyed by spreadsheet Column Names.
_Avoid_: Scalar table schema, array table schema, union table schema

**Table Definition**:
A typed table handle created from a Struct Table Schema and passed to bindings and queries.
_Avoid_: String table name, schema subclass, raw schema lookup

**Table Debug Name**:
A human-readable name attached to a Table Definition for diagnostics and error messages.
_Avoid_: Table key, lookup name, spreadsheet sheet name

**Table Binding**:
Startup configuration that assigns a Table Schema to a concrete Spreadsheet ID and A1 Range.
_Avoid_: Table schema, spreadsheet table, string table name

**Bound Table Range**:
An A1 Range with an explicit top-left cell that contains the Header Row and data rows for one Table Binding.
_Avoid_: Whole-column range, whole-row range, implicit header location, unanchored table range

**Table Registry**:
The startup collection of Table Bindings keyed by their Table Definitions.
_Avoid_: Runtime table discovery, string table map, schema subclass requirement

**Unbound Table**:
A Table Definition requested by a Table Query but absent from the Table Registry.
_Avoid_: Defect, thrown exception, missing string name

**Table Read Failure**:
A failed Table Query caused by the underlying GoogleSheetsClient while reading a bound table range.
_Avoid_: Google Sheets API Failure, invalid row, unbound table

**SpreadsheetOrm**:
A higher-level Effect service that runs Table Queries through registered Table Bindings.
_Avoid_: GoogleSheetsClient, raw Sheets API client, Drive client

**SpreadsheetOrm Factory**:
A direct constructor for a SpreadsheetOrm instance used in tests or custom wiring.
_Avoid_: GoogleSheetsClient Factory, registry, schema factory

**Fake GoogleSheetsClient**:
A test double for GoogleSheetsClient used to verify SpreadsheetOrm behavior without calling Google.
_Avoid_: Live Google API test, ORM integration fixture, credentialed spreadsheet test

**Header Row**:
The first row in a bound table range whose cell values name the table columns.
_Avoid_: Data row, field order, column index contract

**Column Name**:
A header value that must match a Table Schema property key for the first query slice.
_Avoid_: Display label, field alias, column mapping

**Extra Column**:
A spreadsheet column present in the Header Row but not used by the Struct Table Schema.
_Avoid_: Invalid column, schema field, decode failure

**Missing Column**:
A Struct Table Schema property key that is absent from the Header Row.
_Avoid_: Optional omission, invalid row, empty cell

**Duplicate Column**:
A Column Name that appears more than once in the Header Row.
_Avoid_: Repeated field, column alias, harmless duplicate

**Table Query**:
A read of all data rows from one Table Binding decoded through its Table Schema.
_Avoid_: SQL query, filter expression, join, projection

**Find All**:
The first public Table Query operation, returning every decoded row for one Table Definition.
_Avoid_: Raw table read, row decoder API, query builder

**Read-Only ORM Slice**:
The first SpreadsheetOrm capability set, limited to querying bound tables without spreadsheet writes.
_Avoid_: Append support, update support, save operation

**Empty Row**:
A data row in a bound table range where every cell is empty or absent.
_Avoid_: End of table, invalid record, deleted row

**Empty Cell**:
A blank or absent cell in a non-empty data row.
_Avoid_: Empty string, null value, invalid row

**Invalid Row**:
A non-empty data row that cannot be decoded by its Table Schema.
_Avoid_: Skipped row, partial success, Google Sheets API failure

**Effectful Row Decode**:
Decoding a spreadsheet row through a Table Schema inside the Effect model.
_Avoid_: Synchronous-only decode, manual validation, thrown parse

**Spreadsheet Row Number**:
The row number visible in Google Sheets for a row inside a bound table range.
_Avoid_: Array index, data row index, decoded row index

**Unformatted Table Value**:
A spreadsheet cell value read for table decoding before Google display formatting is applied.
_Avoid_: Display value, formatted string, locale-rendered value

**Raw Table String**:
A string cell value passed to a Table Schema without implicit trimming or cleanup.
_Avoid_: Normalized string, cleaned value, auto-trimmed cell

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
- A **Table Schema** defines row shape independently of where that row data is stored.
- The first query slice only supports **Struct Table Schemas** because spreadsheet rows decode into objects keyed by **Column Names**.
- A **Table Definition** wraps a **Struct Table Schema** as the type-safe handle for bindings and queries.
- Creating a **Table Definition** rejects unsupported schema shapes before they enter a **Table Registry**.
- A **Table Debug Name** describes a **Table Definition** in diagnostics but is not used for lookup.
- A **Table Binding** connects exactly one **Table Definition** to one concrete **Spreadsheet ID** and **Bound Table Range** at startup.
- A **Table Binding** validates the **Bound Table Range** enough to identify its explicit top-left cell; full A1 syntax validation remains with Google Sheets.
- A **Table Registry** may contain **Table Bindings** that point to different **Spreadsheet IDs**.
- A **Table Registry** keeps **Table Bindings** separate from **Table Schemas** while using **Table Definitions** for lookup.
- A **Table Registry** rejects duplicate **Table Bindings** for the same **Table Definition**.
- A **Table Registry** rejects duplicate **Table Bindings** for the same **Spreadsheet ID** and **Bound Table Range**.
- A **Table Query** identifies the table through the actual **Table Definition**, not a separate string table name.
- A **Table Query** against an **Unbound Table** fails with a typed expected error.
- A **Table Read Failure** preserves the underlying **GoogleSheetsClient** failure and adds **Table Debug Name** and binding location.
- A **Bound Table Range** includes exactly one **Header Row** followed by zero or more data rows.
- ORM row decoding uses **Header Row** names rather than hardcoded column indexes.
- In the first query slice, each **Column Name** used for decoding must exactly match a **Table Schema** property key.
- A **Table Query** ignores **Extra Columns** that are not used by the **Struct Table Schema**.
- A **Table Query** fails before row decoding when the **Header Row** has a **Missing Column**.
- A **Table Query** fails before row decoding when the **Header Row** has a **Duplicate Column**.
- **Find All** is the only public **Table Query** operation in the first slice.
- The first **Table Query** returns only decoded schema values for every decodable data row from one **Table Binding** without filtering, sorting, joins, projection, or row metadata.
- The first **SpreadsheetOrm** implementation is a **Read-Only ORM Slice** and does not append, update, or clear spreadsheet values.
- A **Table Query** skips **Empty Rows** wherever they appear in the bound range and does not treat them as the end of the table.
- A **Table Query** represents an **Empty Cell** as an absent field before schema decoding.
- A **Table Query** fails when it encounters an **Invalid Row** and reports the table location, **Spreadsheet Row Number**, and schema issue.
- A **Table Query** reads **Unformatted Table Values** before decoding rows through the **Struct Table Schema**.
- A **Table Query** uses **Effectful Row Decode** so schema effects and refinements can participate in row decoding.
- A **Table Query** passes **Raw Table Strings** to the **Struct Table Schema** without implicit trimming.
- Future ORM abstractions read **Spreadsheet Values** through **GoogleSheetsClient** and decode them through **Table Schemas**.
- **SpreadsheetOrm** depends on **GoogleSheetsClient** and a **Table Registry**.
- **SpreadsheetOrm** can be provided through Effect layer composition or a **SpreadsheetOrm Factory**.
- **SpreadsheetOrm** belongs in a package above **GoogleSheetsClient** so Google API payload handling stays separate from ORM row mapping.
- The first **SpreadsheetOrm** slice depends directly on **GoogleSheetsClient** and does not introduce a generic spreadsheet provider abstraction.
- The first **SpreadsheetOrm** slice is verified with a **Fake GoogleSheetsClient** rather than credentialed Google API tests.

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
>
> **Dev:** "Is a **Table Schema** the same thing as the sheet range it reads from?"
> **Domain expert:** "No — the **Table Schema** defines row shape; the **Table Binding** says where that table lives in Google Sheets."
>
> **Dev:** "Should callers query tables by string names?"
> **Domain expert:** "No — callers pass the actual **Table Definition** so the query keeps its row type."
>
> **Dev:** "Should a **Table Schema** contain its spreadsheet location?"
> **Domain expert:** "No — the **Table Registry** binds schema objects to locations at startup."
>
> **Dev:** "Should a table inherit from Effect Schema?"
> **Domain expert:** "No — a **Table Definition** wraps a **Struct Table Schema** instead of subclassing schema internals."
>
> **Dev:** "Can an unsupported schema shape become a **Table Definition**?"
> **Domain expert:** "No — creating a **Table Definition** validates that the schema is table-compatible."
>
> **Dev:** "Is the table's display name used to find its binding?"
> **Domain expert:** "No — the **Table Debug Name** is only for diagnostics; lookup uses **Table Definition** identity."
>
> **Dev:** "Can the same **Table Definition** point to two spreadsheet ranges in one registry?"
> **Domain expert:** "No — duplicate **Table Bindings** would make schema-based queries ambiguous."
>
> **Dev:** "Can two **Table Definitions** point to the same spreadsheet range?"
> **Domain expert:** "No — duplicate binding locations are rejected so one concrete spreadsheet table has one owner in the registry."
>
> **Dev:** "Is querying an unregistered schema a crash?"
> **Domain expert:** "No — an **Unbound Table** is reported as a typed query error."
>
> **Dev:** "Should a low-level Google read error lose table context?"
> **Domain expert:** "No — a **Table Read Failure** keeps the original client failure and adds the table and range that were being queried."
>
> **Dev:** "Should application code call **GoogleSheetsClient** directly for ORM table reads?"
> **Domain expert:** "No — table reads go through **SpreadsheetOrm**, which delegates raw Sheets access to **GoogleSheetsClient**."
>
> **Dev:** "Should **SpreadsheetOrm** live inside the **GoogleSheetsClient** package?"
> **Domain expert:** "No — **SpreadsheetOrm** is a higher-level package that depends on **GoogleSheetsClient**."
>
> **Dev:** "Should **SpreadsheetOrm** hide **GoogleSheetsClient** behind a generic provider interface?"
> **Domain expert:** "No — the first slice depends directly on **GoogleSheetsClient** until another spreadsheet backend exists."
>
> **Dev:** "Do tests need a full Effect layer graph for table queries?"
> **Domain expert:** "No — tests may use a **SpreadsheetOrm Factory** when direct wiring is clearer."
>
> **Dev:** "Should first ORM tests call the live Google Sheets API?"
> **Domain expert:** "No — first-slice ORM tests use a **Fake GoogleSheetsClient** and focus on registry lookup, header mapping, and decoding."
>
> **Dev:** "Can any Effect Schema be a table?"
> **Domain expert:** "No — the first slice supports **Struct Table Schemas** because rows are decoded as objects keyed by **Column Names**."
>
> **Dev:** "Can we bind a table range that only contains data rows?"
> **Domain expert:** "No — a bound table range starts with a **Header Row** so columns can be matched by name."
>
> **Dev:** "Can a table binding use a whole-column range like `Users!A:Z`?"
> **Domain expert:** "No — a **Bound Table Range** has an explicit top-left cell so diagnostics can report **Spreadsheet Row Numbers**."
>
> **Dev:** "Can a table binding use a whole-row range like `Users!1:1000`?"
> **Domain expert:** "No — a **Bound Table Range** starts at a concrete cell such as `A1` or `B5`."
>
> **Dev:** "Can one **SpreadsheetOrm** query tables from multiple Google spreadsheets?"
> **Domain expert:** "Yes — each **Table Binding** carries its own **Spreadsheet ID**."
>
> **Dev:** "Should **SpreadsheetOrm** fully validate every A1 range?"
> **Domain expert:** "No — it validates the **Bound Table Range** only enough to find the top-left cell; Google Sheets owns full range validation."
>
> **Dev:** "Can spreadsheet headers use display labels that differ from schema fields?"
> **Domain expert:** "No — the first slice requires each decoded **Column Name** to match a **Table Schema** property key exactly."
>
> **Dev:** "Do extra spreadsheet columns make table decoding fail?"
> **Domain expert:** "No — **Extra Columns** are ignored when they are not used by the **Struct Table Schema**."
>
> **Dev:** "Can a schema field be absent from the spreadsheet header?"
> **Domain expert:** "No — a **Missing Column** fails the **Table Query** before row decoding."
>
> **Dev:** "Can a spreadsheet header repeat the same column name?"
> **Domain expert:** "No — a **Duplicate Column** makes row mapping ambiguous and fails the **Table Query**."
>
> **Dev:** "Should the first ORM API expose raw table parsing helpers?"
> **Domain expert:** "No — the first public query operation is **Find All**; lower-level parsing remains internal."
>
> **Dev:** "Should successful **Find All** rows include spreadsheet row numbers?"
> **Domain expert:** "No — successful rows contain only decoded schema values; row numbers are diagnostic metadata for failures."
>
> **Dev:** "Does a **Table Query** support filters or joins in the first slice?"
> **Domain expert:** "No — the first slice reads all data rows from one bound table and decodes them."
>
> **Dev:** "Should the first **SpreadsheetOrm** slice write rows?"
> **Domain expert:** "No — the first slice is a **Read-Only ORM Slice** focused on table querying."
>
> **Dev:** "Does a blank row stop a **Table Query**?"
> **Domain expert:** "No — an **Empty Row** is skipped even if later rows contain data."
>
> **Dev:** "Is a blank cell decoded as an empty string?"
> **Domain expert:** "No — an **Empty Cell** becomes an absent field, and the **Table Schema** decides whether that is valid."
>
> **Dev:** "Should invalid spreadsheet rows be skipped?"
> **Domain expert:** "No — an **Invalid Row** fails the **Table Query** so bad spreadsheet data is visible."
>
> **Dev:** "Should row decoding be synchronous-only?"
> **Domain expert:** "No — **Effectful Row Decode** keeps row decoding inside the Effect model."
>
> **Dev:** "Should row errors report array indexes?"
> **Domain expert:** "No — row errors report the **Spreadsheet Row Number** that users see in Google Sheets."
>
> **Dev:** "Should table decoding use formatted spreadsheet display text?"
> **Domain expert:** "No — a **Table Query** reads **Unformatted Table Values** and lets the **Struct Table Schema** validate the row."
>
> **Dev:** "Should table decoding trim spreadsheet strings automatically?"
> **Domain expert:** "No — a **Raw Table String** reaches the **Table Schema** unchanged, and cleanup belongs in the schema if needed."

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
- "SpreadsheetORM table" was split into **Table Definition** for the type-safe table handle, **Table Schema** for row shape, and **Table Binding** for startup mapping to a concrete spreadsheet range.
- "table name" was rejected as the query handle; **Table Queries** use the actual **Table Definition** for type-safe lookup.
- "debug table name" was accepted as **Table Debug Name** for diagnostics only, not lookup.
- "schema class with location" was resolved as a separate **Table Registry** keyed by **Table Definitions**.
- "multiple bindings for one table" was rejected because **Table Queries** use **Table Definition** identity.
- "multiple table definitions for one bound range" was rejected because a registry gives one concrete spreadsheet table one owner.
- "unsupported schema shape" was resolved as a **Table Definition** creation error, not a registry or query-time concern.
- "unregistered schema query" was resolved as **Unbound Table**, a typed expected error.
- "Google read failure in ORM" was resolved as **Table Read Failure**, which wraps client failures with table context.
- "ORM entrypoint" was resolved as **SpreadsheetOrm**, exposed through Effect service composition and a **SpreadsheetOrm Factory**.
- "ORM package location" was resolved as a package above **GoogleSheetsClient**, not inside the low-level client package.
- "spreadsheet provider abstraction" was deferred; the first **SpreadsheetOrm** slice depends directly on **GoogleSheetsClient**.
- "first ORM test boundary" was resolved as **Fake GoogleSheetsClient** tests, not live Google API tests.
- "Effect Schema as table" was narrowed to **Struct Table Schema** for the first query slice.
- "table range" was resolved as **Bound Table Range**, an A1 range with an explicit top-left cell containing a **Header Row** followed by data rows.
- "multiple spreadsheets" was supported by allowing **Table Bindings** in one **Table Registry** to point to different **Spreadsheet IDs**.
- "A1 validation" was narrowed to focused **Bound Table Range** top-left-cell validation.
- "column mapping" was deferred; the first query slice uses exact **Column Name** to **Table Schema** property key matching.
- "extra spreadsheet columns" was resolved as **Extra Columns**, which are ignored by **Table Queries**.
- "missing schema columns" was resolved as **Missing Columns**, which fail **Table Queries** before row decoding.
- "duplicate header names" was resolved as **Duplicate Columns**, which fail **Table Queries** before row decoding.
- "first public query API" was resolved as **Find All** only; raw table parsing helpers stay internal.
- "row metadata in successful results" was rejected; **Find All** returns decoded schema values only.
- "query" was narrowed to **Table Query** for the first slice: read all rows from one binding and decode them.
- "writes in the first ORM slice" were explicitly deferred; the first implementation is a **Read-Only ORM Slice**.
- "blank row" was resolved as **Empty Row**, which is skipped rather than treated as the end of a table.
- "blank cell" was resolved as **Empty Cell**, which becomes an absent field before schema decoding.
- "decode failure" was resolved as **Invalid Row**, which fails the whole **Table Query** rather than returning partial success.
- "row decoding mode" was resolved as **Effectful Row Decode**, not synchronous-only decoding.
- "row number in errors" was resolved as **Spreadsheet Row Number**, the row number visible in Google Sheets.
- "cell values for table decoding" was resolved as **Unformatted Table Values**, not formatted display strings.
- "string cleanup" was resolved as explicit schema behavior; **Table Queries** pass **Raw Table Strings** unchanged.
