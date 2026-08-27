# gigaslop/no-fs-datastore

Disallow file-backed datastores. This app must call the project's existing HTTP APIs instead of keeping source-of-truth data in local JSON/Level/NeDB files.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

## Rule Details

Three checks:

1. **Packages** — same specifier coverage as [no-database-packages](./no-database-packages.md) (`import` / `require` / `import()` / `package.json` via `recommended-sidecars`).
2. **Filenames** — the linted file *is* a store: `*.db`, `*.ldb`, `db.json`, `data/*.json`, …
3. **Writes** — `writeFile` / `writeFileSync` / `appendFile` / `Bun.write` / `Deno.writeTextFile` / fs-extra `outputJson` whose path looks like a store (`data/users.json`, `db.json`, `*.sqlite`, …). `path.join(__dirname, 'data', 'users.json')` is included when enough segments are string literals.

SQLite **drivers** (`better-sqlite3`, `sqlite3`, …) stay on [no-database-packages](./no-database-packages.md). SQLite **files** (`*.sqlite`) stay on [no-database-config-files](./no-database-config-files.md) so recommended does not report twice. This rule still flags `writeFile('app.sqlite')` in application code.

### Packages

`lowdb`, `steno`, `level`, `leveldown`, `levelup`, `classic-level`, `abstract-level`, `encoding-down`, `memdown`, `memory-level`, `browser-level`, `rocksdb`, `rocks-level`, `nedb`, `@seald-io/nedb`, `lokijs`, `json-server`, `node-json-db`, `simple-json-db`, `flat-file-db`, `node-persist`, `@keyv/file`, `pouchdb`, `pouchdb-node`, `pouchdb-adapter-leveldb`

### Filenames

| Pattern | Matches |
| --- | --- |
| `\.db$` | `app.db`, `var/app.db` |
| `\.ldb$` / `\.leveldb$` | LevelDB files |
| `(^\|/)(data\|db\|database\|store\|datastore)/.+\.(json\|db)$` | `data/users.json`, `db/records.json` |
| `(^\|/)(db\|database\|datastore\|store)\.json$` | json-server's `db.json` |

Reading those files (`readFileSync('data/users.json')`) is not flagged. Creating them as the data layer is.

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-fs-datastore: "error" */

import { Low } from 'lowdb';
import { Level } from 'level';
fs.writeFileSync('data/users.json', JSON.stringify(users));
await writeFile('db.json', '{}');
```

```js
// filename: data/users.json
// filename: db.json
// filename: var/app.db
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-fs-datastore: "error" */

import { readFile } from 'node:fs/promises';
fs.writeFileSync('README.md', '# hi');
fs.writeFileSync('src/generated/output.json', '{}');
fetch('/api/widgets');
```

## Options

```jsonc
{
  "gigaslop/no-fs-datastore": ["error", {
    "allow": ["lowdb"],
    "additionalBlocked": ["my-json-db"],
    "additionalFilePatterns": ["(^|/)cache/.+\\.json$"],
    "checkFsWrites": true
  }]
}
```

Set `checkFsWrites` to `false` to only flag packages and datastore filenames.

## When Not To Use It

Do not enable this rule in a project whose official data layer *is* a local JSON/Level file. Prefer `allow` for a single package rather than turning the rule off.

## Limitations

- Dynamic paths (`writeFile(pathVariable)`) are not checked.
- Spreading `configs["recommended-sidecars"]` registers a stub processor for `*.db`, `db.json`, and `data/**/*.json`. Without that config, add those globs and `processor: "gigaslop/stub"`.
- JSON under `data/` used for i18n, fixtures, or static lookups (`lib/data/*.json`) will be flagged. Exclude those paths with ESLint `ignores` or a narrower `files` glob.

## Related Rules

- [no-database-packages](./no-database-packages.md) — SQL/ORM/BaaS SDKs
- [no-database-config-files](./no-database-config-files.md) — Prisma, Drizzle config, `*.sqlite`, Compose
- [no-http-servers](./no-http-servers.md) — a second HTTP process (`json-server` is flagged here because it *is* a JSON file store)
