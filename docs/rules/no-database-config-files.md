# gigaslop/no-database-config-files

Disallow database schema/config files such as `prisma/schema.prisma` or `drizzle.config.ts`. This app talks to the project's existing HTTP APIs and must not define its own database schema.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

## Rule Details

Runs on the `Program` node and reports if the **filename** (normalized to `/` separators) matches a blocked pattern. File contents are not inspected.

Default patterns (case-insensitive):

| Pattern | Matches |
| --- | --- |
| `(^\|/)prisma/schema\.prisma$` | `prisma/schema.prisma` at the repo root or under a parent path |
| `\.prisma$` | any `*.prisma` file |
| `(^\|/)drizzle\.config\.[cm]?[jt]s$` | `drizzle.config.js`, `.ts`, `.mjs`, `.cjs`, `.mts`, `.cts` |

ESLint `<input>` / `<text>` buffers (RuleTester inline snippets without a filename) are skipped.

Examples of **incorrect** code (the filename is what matters):

```js
// filename: prisma/schema.prisma
// filename: apps/web/custom.schema.prisma
// filename: drizzle.config.ts
// filename: apps/web/drizzle.config.mjs
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

The rule only runs on files **ESLint already lints**. Spreading `configs.recommended` registers a processor for `**/*.prisma`, so Prisma schemas are included. `drizzle.config.ts` is ordinary TypeScript and is linted without a processor.

If you enable this rule without recommended, add `**/*.prisma` yourself and set `processor` to `gigaslop/prisma`, otherwise `.prisma` files are skipped.

## Related Rules

- [no-database-packages](./no-database-packages.md) — flags Prisma/Drizzle/ORM imports in application code
- [no-database-env-vars](./no-database-env-vars.md) — flags connection env vars and URI literals
- [no-raw-database-apis](./no-raw-database-apis.md) — flags driver-shaped constructors/calls
