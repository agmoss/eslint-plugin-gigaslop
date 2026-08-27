# eslint-plugin-gigaslop

`gigaslop` (noun) A large, fundamentally disastarous level of slop.

For the case where AI coding agents reach for `pg`/`prisma`/`@supabase/supabase-js`
etc. as a shortcut instead of calling the existing API layer.

## Why?

In large enterprise apps, there is often a dedicated API/data layer serving CRUD functionality of the frontend(s). Agents love ignoring this in favor of their own creations. Often, this manifests itself as direct database access for CRUD as well as schema modififictions and migrations. This additional data layer is a dangerous liability.

Agents default to “put a database client in the frontend app” because that is how most tutorials and starters are written. It is also the simplest way to achieve the goal of the prompt. It is challenging to get an agent to prioritize organizational structure over a brute force quick win.

This is not a matter of syntactical preference or design philosophy. In a data intensive API driven app, the circumvention of the dedicated API layer is fundamental flaw that, if introduced, is both painful and immediatly necessary to unwind.

This eslint plugin aims to thwart the introduction of this pattern. It contains rules for finding common agent (or human tbh) inclusions of database access outside of the approved API layer. When used in conjunction with a pre-build or pre-commit hook, it can block the introduction of this pattern before reaching production.

This is particularly useful when the front end outcomes are driven by product teams using agent tools.

## Why this?

I tend to favor the philosophy of "compiler driven development", where via strong typing, you let the compiler identify contract incongruency and raise runtime errors. I see linting in the same light. It is deterministic and when used strictly, it can provide an "invisible hand" to guide the software development process in the "correct", agreed upon architecture, no matter how hard an agent or human tries to fight it.

## Why not just markdown?

If you are developing a client side app with a dedicated API layer, you can and should include something like:

```markdown
Do not install or import database drivers or ORMs.
Forbidden packages include (non-exhaustive):
pg, postgres, pg-promise, mysql, mysql2, mariadb, mongodb, mongoose,
better-sqlite3, sqlite3, redis, ioredis, mssql, prisma, @prisma/client,
drizzle-orm, drizzle-kit, kysely, typeorm, sequelize, knex,
@neondatabase/serverless, @vercel/postgres, @vercel/kv,
@planetscale/database, @libsql/client, @upstash/redis,
@supabase/supabase-js (unless already in the repo as the approved client).

Data access MUST go through the existing dedicated APIs.
Do not add DATABASE_URL, prisma/schema.prisma, or drizzle.config.ts.
Do not create a new database layer in this client side app.
```

I have found that this and other architectural non negotiables are valuable to include in your `agents.md` file. However, these are just guides. They can be prompted over and ignored. Linting is **structural** and unopinionated, its results are deterministic and cause error codes.

## Downsides

Yes, you or an agent can just uninstall this package or use lint ignores to ignore the rules. There is no surefire way around that. IMO when using this package you must remain diligent to scan for that. Again, IMO, this is easier to scan for than scanning for the numerous ways a new API layer can get introduced into your app.

What you could do is use this package outside the agent context. That or use a system/script outside of the agent context that enforces its proper use.

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

Spreading `recommended` also lints sidecar files (`**/*.prisma`, `**/*.sqlite`, `**/*.db`, `data/**/*.json`, Prisma migrations, Compose YAML) and `**/package.json` via processors so schema files, SQLite, JSON stores, compose stacks, and newly added dependencies are flagged, not only application imports.

## Usage (legacy `.eslintrc*`)

```json
{
  "extends": ["plugin:gigaslop/recommended-legacy"]
}
```

(The `plugin:` prefix loads the plugin package for you — no separate `"plugins"` entry needed.)

## Rules

| Rule                                                                          | Recommended | What it catches                                                                                                         |
| ----------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`gigaslop/no-database-packages`](docs/rules/no-database-packages.md)         | `"error"`   | Blocked driver/ORM/BaaS imports, including `package.json` dependencies.                                                 |
| [`gigaslop/no-database-env-vars`](docs/rules/no-database-env-vars.md)         | `"error"`   | `DATABASE_URL` / `PGHOST` / connection-string literals.                                                                 |
| [`gigaslop/no-database-config-files`](docs/rules/no-database-config-files.md) | `"error"`   | Schema/config/sidecar files: Prisma, Drizzle config, `*.sqlite`, `prisma/migrations`, Compose YAML.                     |
| [`gigaslop/no-baas-http`](docs/rules/no-baas-http.md)                         | `"error"`   | `fetch`/URL strings to Supabase, Neon, Upstash, and other database HTTP APIs.                                           |
| [`gigaslop/no-raw-sql`](docs/rules/no-raw-sql.md)                             | `"error"`   | `sql\`...\``tags and strings that look like`SELECT … FROM`/`INSERT INTO` / …                                            |
| [`gigaslop/no-http-servers`](docs/rules/no-http-servers.md)                   | `"error"`   | Express, Fastify, Hono, Nest, Apollo Server, graphql-yoga, … — a second backend. Turn off if this repo _is_ the server. |
| [`gigaslop/no-disable-gigaslop`](docs/rules/no-disable-gigaslop.md)           | `"error"`   | `eslint-disable` comments that mention `gigaslop/…`.                                                                    |
| [`gigaslop/no-fs-datastore`](docs/rules/no-fs-datastore.md)                   | `"error"`   | File-backed stores: lowdb/Level/NeDB, `writeFile('data/*.json')`, `db.json`, `*.db`.                                    |
| [`gigaslop/no-raw-database-apis`](docs/rules/no-raw-database-apis.md)         | opt-in      | `new Pool()` / `new Client()` / `createClient()` by identifier (noisy).                                                 |

`no-raw-database-apis` is **not** in `recommended`. Identifier matching is too noisy for
`new Client()` / `createClient()` in typical apps.

If this repository **is** the HTTP API, turn off `gigaslop/no-http-servers` (or `allow` the framework).

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

### `no-baas-http`

```jsonc
{
  "gigaslop/no-baas-http": [
    "error",
    {
      "additionalHosts": ["db.internal.example.com"],
      "allowHosts": ["supabase.co"],
    },
  ],
}
```

### `no-raw-sql`

```jsonc
{
  "gigaslop/no-raw-sql": [
    "error",
    {
      "additionalTags": ["query"],
      "checkLiterals": true,
    },
  ],
}
```

### `no-http-servers`

```jsonc
{
  "gigaslop/no-http-servers": [
    "error",
    {
      "allow": ["express"],
      "categories": ["http", "graphql"],
    },
  ],
}
```

### `no-disable-gigaslop`

```jsonc
{
  "gigaslop/no-disable-gigaslop": [
    "error",
    {
      "banUnqualifiedDisable": false,
    },
  ],
}
```

### `no-fs-datastore`

```jsonc
{
  "gigaslop/no-fs-datastore": [
    "error",
    {
      "allow": ["lowdb"],
      "additionalBlocked": ["my-json-db"],
      "additionalFilePatterns": ["(^|/)cache/.+\\.json$"],
      "checkFsWrites": true,
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
npm run lint:md     # markdownlint
npm run format:md   # markdownlint --fix
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
