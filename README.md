# eslint-plugin-gigaslop

`gigaslop` (noun) A large, fundamentally disastarous level of slop.

For the case where AI coding agents reach for `pg`/`prisma`/`@supabase/supabase-js`
etc. as a shortcut instead of calling the existing API layer.

## Install

```bash
npm install --save-dev eslint-plugin-gigaslop
```

## Usage (flat config, ESLint 9+ / ESLint 8.57+)

```js
// eslint.config.js
import gigaslop from "eslint-plugin-gigaslop";

export default [
  // ...your other config
  ...gigaslop.configs.recommended,
];
```

Spreading `recommended` also lints `**/*.prisma` and `**/package.json` (via processors)
so schema files and newly added dependencies are flagged, not only application imports.

## Usage (legacy `.eslintrc*`)

```json
{
  "extends": ["plugin:gigaslop/recommended-legacy"]
}
```

(The `plugin:` prefix loads the plugin package for you — no separate `"plugins"` entry needed.)

## Rules

| Rule                                                                          | Recommended | What it catches                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`gigaslop/no-database-packages`](docs/rules/no-database-packages.md)         | `"error"`   | `import`/`require`/dynamic `import()`/`export ... from`/`import x = require()` of any blocked driver, ORM, serverless/edge DB client, or BaaS SDK — including subpath imports (`pg/lib/foo`), runtime specifiers (`node:sqlite`, `bun:sqlite`), wildcard families (`@prisma/adapter-*`, `@mikro-orm/*`), and blocked names listed in `package.json`. |
| [`gigaslop/no-database-env-vars`](docs/rules/no-database-env-vars.md)         | `"error"`   | Reading `DATABASE_URL` / `PGHOST` / … on `process.env`, `import.meta.env`, `env`, or `Deno.env.get()`, plus `postgres://` / `mongodb://` / `redis://` connection-string literals and template literals.                                                                                                                                              |
| [`gigaslop/no-database-config-files`](docs/rules/no-database-config-files.md) | `"error"`   | Linting a file that _is_ a database schema/config file: `prisma/schema.prisma`, any `*.prisma`, `drizzle.config.{js,ts,mjs,cjs,mts,cts}`.                                                                                                                                                                                                            |
| [`gigaslop/no-raw-database-apis`](docs/rules/no-raw-database-apis.md)         | opt-in      | `new Pool()`, `new Client()`, `new MongoClient()`, `createConnection()`, `createPool()`, `createClient()`, `MongoClient.connect()` — identifier-only, so it false-positives on Discord/Redis/HTTP `Client`s. Enable explicitly if you want that extra net.                                                                                           |

`no-raw-database-apis` is **not** in `recommended`. Identifier matching is too noisy for
`new Client()` / `createClient()` in typical apps.

Because the blocklist rules apply to every file, they also cover "putting database code in
`app/api/*` just this once" and "generating a new backend inside Next.js instead of calling
existing APIs" — there's no path exemption, so a blocked import/pattern is flagged the same
way whether it's in `app/api/route.ts`, a server action, or anywhere else.

## Options

### `no-database-packages`

```jsonc
{
  "gigaslop/no-database-packages": [
    "error",
    {
      // Exempt a package — e.g. it IS this project's official data-access SDK.
      "allow": ["@supabase/supabase-js"],
      // Block additional packages/wildcards beyond the built-in list.
      "additionalBlocked": ["some-internal-db-shim"],
      // Only enforce a subset of categories: "drivers" | "orms" | "serverless" | "baas".
      "categories": ["drivers", "orms"],
    },
  ],
}
```

### `no-database-env-vars`

```jsonc
{
  "gigaslop/no-database-env-vars": [
    "error",
    {
      "envVars": ["MY_CUSTOM_DB_URL"],
      "envVarPatterns": ["^ACME_DB_.*$"],
      "checkDefaultPattern": true,
      "checkConnectionStrings": true,
    },
  ],
}
```

### `no-raw-database-apis`

Not in `recommended`. Opt in when you want identifier-based matching on top of the import blocklist:

```jsonc
{
  "gigaslop/no-raw-database-apis": [
    "error",
    {
      "additionalConstructors": ["S3Client"],
      "additionalCalls": ["createSession"],
    },
  ],
}
```

### `no-database-config-files`

```jsonc
{
  "gigaslop/no-database-config-files": [
    "error",
    {
      "patterns": ["(^|/)my-custom-schema\\.yaml$"],
    },
  ],
}
```

## Development

```bash
npm install
npm run build      # tsup -> dist/ (esm + cjs + .d.ts)
npm run typecheck   # tsc --noEmit
npm test            # RuleTester-based tests via node:test
```

## Publishing and versioning

Published to npm as [`eslint-plugin-gigaslop`](https://www.npmjs.com/package/eslint-plugin-gigaslop).

`package.json` `"files"` is `["dist"]`. npm always adds `package.json` and `README.md` (and `LICENSE` if you add one). `dist/` is gitignored; `prepublishOnly` runs `npm run build` so the tarball still contains the compiled plugin.

### Versioning

Follow [semver](https://semver.org/). This package is `0.1.0`: until `1.0.0`, breaking changes may ship in a minor bump.

| Bump      | Use when                                                                         |
| --------- | -------------------------------------------------------------------------------- |
| **patch** | bug fix, docs, or a blocklist addition that only flags new packages/patterns     |
| **minor** | new rule, new option, or a non-breaking recommended-config addition              |
| **major** | removing a rule, changing recommended defaults, or dropping an ESLint/Node range |

Bump **both** of these — they are not wired together:

- `"version"` in `package.json`
- `plugin.meta.version` in `src/index.ts`

```bash
npm version patch    # 0.1.0 → 0.1.1
npm version minor    # 0.1.0 → 0.2.0
npm version major    # 0.1.0 → 1.0.0
```

Never reuse a version that has already been published.

### First publish

1. Create an [npm](https://www.npmjs.com/signup) account and run `npm login`.
2. Confirm the name is free: `npm view eslint-plugin-gigaslop` should 404.
3. Dry-run (lists the tarball contents; does not upload):

```bash
npm test
npm run typecheck
npm publish --dry-run
```

You should see `dist/index.js`, `dist/index.cjs`, and `dist/index.d.ts` in the file list — not `src/` or `tests/`.

4. Publish:

```bash
npm publish
```

The package is unscoped, so it is public by default. If the account has 2FA enabled:

```bash
npm publish --otp=123456
```

5. Push the git tag if you used `npm version`:

```bash
git push && git push --tags
```

### Later releases

```bash
npm test && npm run typecheck
# bump package.json + src/index.ts (see above)
npm publish
git push --follow-tags
```
