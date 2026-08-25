# gigaslop/no-database-env-vars

Disallow reading database connection env vars (`DATABASE_URL`, `POSTGRES_URL`, `PGHOST`, …) or hardcoding database connection-string literals.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

## Rule Details

Reports two kinds of access:

1. **Env vars** — a static property or destructured key whose name is on the exact blocklist or matches the fallback pattern. The object does not have to be `process.env`: `import.meta.env.DATABASE_URL`, `env.DATABASE_URL` (t3-env / `@next/env`), and `const { DATABASE_URL } = config` are flagged too. `Deno.env.get('DATABASE_URL')` is also flagged.
2. **Connection-string literals** — string literals and template literals whose value (or first template quasi) starts with a database URI scheme (`postgres://`, `mongodb+srv://`, `redis://`, …). Concatenation is caught when the left-hand literal itself matches (`'postgres://' + host`).

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-database-env-vars: "error" */

const url = process.env.DATABASE_URL;
const url2 = process.env['POSTGRES_URL'];
const { MONGODB_URI } = process.env;
const vercel = process.env.POSTGRES_PRISMA_URL;
const host = process.env.PGHOST;
const vite = import.meta.env.DATABASE_URL;
const t3 = env.DATABASE_URL;
const { DATABASE_URL } = env;
const deno = Deno.env.get('DATABASE_URL');
const conn = 'postgres://user:pass@host:5432/db';
const mongo = 'mongodb+srv://user:pass@cluster.mongodb.net/db';
const tmpl = `postgres://${user}@host/db`;
const concat = 'postgres://' + host;
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-database-env-vars: "error" */

const url = process.env.API_BASE_URL;
const { API_BASE_URL } = process.env;
const host = process.env.API_HOST;
const msg = 'hello world';
```

## Options

```jsonc
{
  "gigaslop/no-database-env-vars": [
    "error",
    {
      "envVars": ["MY_CUSTOM_DB_URL"],
      "envVarPatterns": ["^ACME_DB_.*$"],
      "checkDefaultPattern": true,
      "checkConnectionStrings": true
    }
  ]
}
```

### `envVars`

Additional exact env var names to block, merged with the defaults.

Default exact names: `DATABASE_URL`, `POSTGRES_URL`, `MONGODB_URI`, `REDIS_URL`, `PGHOST`, `PGHOSTADDR`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGURI`, `PGURL`.

```js
/* eslint gigaslop/no-database-env-vars: ["error", { "envVars": ["MY_CUSTOM_DB_URL"] }] */

const url = process.env.MY_CUSTOM_DB_URL; // flagged
```

### `envVarPatterns`

Extra JavaScript regex source strings tested against the env var name (in addition to the built-in fallback pattern, unless that is disabled).

### `checkDefaultPattern`

When `false`, skip the built-in fallback pattern. Default: `true`.

The default pattern matches names like `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `MYSQL_URL`, and `MONGO_URL`:

```
^(DATABASE|POSTGRES?|MYSQL|MARIADB|MONGO(DB)?|REDIS|MSSQL|SQLITE|ORACLE|CASSANDRA)(_[A-Z0-9]+)*_(URL|URI|CONN(ECTION)?(_STRING)?)$
```

```js
/* eslint gigaslop/no-database-env-vars: ["error", { "checkDefaultPattern": false }] */

const url = process.env.POSTGRES_PRISMA_URL; // allowed
const db = process.env.DATABASE_URL; // still flagged (exact default name)
```

### `checkConnectionStrings`

When `false`, do not flag string literals that look like connection URIs. Default: `true`.

Default URI scheme pattern (case-insensitive):

```
^(postgres(ql)?|mysql|mariadb|mongodb(\+srv)?|redis|rediss|mssql|oracle):\/\/
```

## When Not To Use It

Turn `checkConnectionStrings` off if the codebase stores example URIs in tests or docs-as-code and those literals are not used to open a connection.

Disable the rule entirely only if this app is allowed to read database URLs (for example it **is** the dedicated data service). Prefer tightening `envVars` / `envVarPatterns` over turning the rule off.

## Limitations

- Only static names are checked. `process.env[variable]` is not flagged.
- Comments are not string literals and are never reported.

## Related Rules

- [no-database-packages](./no-database-packages.md) — flags driver/ORM/BaaS imports
- [no-raw-database-apis](./no-raw-database-apis.md) — flags driver-shaped constructors/calls
- [no-database-config-files](./no-database-config-files.md) — flags schema/config filenames
