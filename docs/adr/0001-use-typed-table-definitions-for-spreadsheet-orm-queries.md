# Use typed table definitions for spreadsheet ORM queries

Spreadsheet ORM queries use typed Table Definitions created from Struct Table Schemas, rather than string table names, raw Effect Schema object lookup, or classes that inherit from Effect Schema internals. This keeps query calls type-safe, gives bindings a stable identity, leaves schemas reusable and location-independent, and provides a place for table-specific diagnostics such as a Table Debug Name without coupling the ORM to JavaScript symbol names or Google Sheets locations.

The first ORM slice lives above the GoogleSheetsClient package, depends directly on that client, and remains read-only through a single Find All operation. This preserves the existing low-level Google Sheets boundary while proving the startup registry, bound range, header mapping, and Effectful Row Decode path before adding writes or richer query semantics.
