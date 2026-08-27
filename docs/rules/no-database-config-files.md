# gigaslop/no-database-config-files

Disallow database schema/config files such as `prisma/schema.prisma` or `drizzle.config.ts`. This app talks to the project's existing HTTP APIs and must not define its own database schema.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

## Rule Details

Runs on the `Program` node and reports if the **filename** (normalized to `/` separators) matches a blocked pattern. File contents are not inspected.

Default patterns (case-insensitive):

| Pattern | Matches |
| --- | --- |
| `(^\|/)prisma/schema\.prisma$` | `prisma/schema.prisma` |
| `\.prisma$` | any `*.prisma` file |
| `(^\|/)prisma/migrations(/\|$)` | Prisma migration directories |
| `(^\|/)drizzle\.config\.[cm]?[jt]s$` | `drizzle.config.js`, `.ts`, `.mjs`, `.cjs`, `.mts`, `.cts` |
| `\.sqlite3?$` | `*.sqlite`, `*.sqlite3` |
| `(^\|/)docker-compose(\.[\w.-]+)?\.ya?ml$` | `docker-compose.yml` and `docker-compose.*.yml` |
| `(^\|/)compose\.ya?ml$` | Compose v2 `compose.yaml` |

ESLint `<input>` / `<text>` buffers (RuleTester inline snippets without a filename) are skipped.

Examples of **incorrect** code (the filename is what matters):

```js
// filename: prisma/schema.prisma
// filename: apps/web/custom.schema.prisma
// filename: prisma/migrations/20240101_init/migration.sql
// filename: drizzle.config.ts
// filename: apps/web/drizzle.config.mjs
// filename: data/app.sqlite
// filename: docker-compose.yml
// filename: compose.yaml
```

Examples of **correct** code:

```js
// filename: app/config.ts
export const config = {};

// filename: src/db-client-config.ts
export const config = {};
```

## Options

```jsonc
{
  "gigaslop/no-database-config-files": [
    "error",
    {
      "patterns": ["(^|/)my-custom-schema\\.yaml$"]
    }
  ]
}
```

### `patterns`

Extra regex source strings, concatenated onto the defaults and matched against the normalized file path.

```js
/* eslint gigaslop/no-database-config-files: ["error", { "patterns": ["(^|/)schema\\.sql$"] }] */

// filename: db/schema.sql → flagged
```

## When Not To Use It

Do not enable this rule in a project that owns a Prisma or Drizzle schema. This plugin is for apps that must not introduce a database layer.

## Limitations

The rule only runs on files **ESLint already lints**. Spreading `configs["recommended-sidecars"]` registers a stub processor for Prisma schemas, SQLite files, Prisma migrations, and Compose YAML so those filenames are included. `drizzle.config.ts` is ordinary TypeScript and is linted by `configs.recommended` without a processor.

If you enable this rule without `recommended-sidecars`, add the sidecar globs yourself and set `processor` to `gigaslop/stub`.

## Related Rules

- [no-database-packages](./no-database-packages.md) — flags Prisma/Drizzle/ORM imports in application code
- [no-database-env-vars](./no-database-env-vars.md) — flags connection env vars and URI literals
- [no-raw-database-apis](./no-raw-database-apis.md) — flags driver-shaped constructors/calls
- [no-fs-datastore](./no-fs-datastore.md) — file-backed JSON/Level/NeDB stores
