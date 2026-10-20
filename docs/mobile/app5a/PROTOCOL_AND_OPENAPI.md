# Protocol and OpenAPI

Every mutation envelope includes `operationId`, `sessionId`, `kind`, `baseRevision`, `schemaVersion: 1`, optional diagnostic `clientCreatedAt`, and a validated payload. Success returns the operation ID, canonical session/resource result, authoritative revision, server timestamp, receipt state, and replay flag. Conflict responses distinguish reused IDs, stale revisions, completed sessions, and missing/foreign sessions. See [openapi.json](./openapi.json).
