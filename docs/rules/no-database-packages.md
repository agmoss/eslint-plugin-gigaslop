# gigaslop/no-database-packages

Disallow importing or requiring database drivers, ORMs, serverless/edge database clients, or BaaS SDKs. This app must talk to the project's existing HTTP APIs, not a database directly.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

## Rule Details

Flags a blocked package when the specifier resolves to an npm package name on the blocklist. Subpath imports still match the package (`pg/lib/parser` → `pg`). Wildcard blocklist entries match one extra path segment (`@prisma/adapter-*` matches `@prisma/adapter-neon`; `@mikro-orm/*` matches `@mikro-orm/core`).

Covered syntax:

- `import ... from '…'`
- `export … from '…'` / `export * from '…'`
- dynamic `import('…')` with a string literal
- `require('…')` and `require.resolve('…')` with a string literal
- TypeScript `import x = require('…')`
- dependency names in `package.json` when the recommended processor is enabled

Relative (`./`, `../`), absolute (`/`), and `~` specifiers are ignored. Runtime prefixes `node:`, `bun:`, `npm:`, and `jsr:` are stripped before matching, so `node:sqlite` is treated as `sqlite`.

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-database-packages: "error" */

import { Pool } from 'pg';
import parser from 'pg/lib/parser';
const { Client } = require('pg');
require.resolve('mongoose');
export * from 'drizzle-orm';
export { db } from '@prisma/client';
await import('@vercel/postgres');
import adapter from '@prisma/adapter-neon';
import core from '@mikro-orm/core';
import { createClient } from '@supabase/supabase-js';
import { getFirestore } from 'firebase/firestore';
import { DatabaseSync } from 'node:sqlite';
import x = require('mysql');
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-database-packages: "error" */

import { useState } from 'react';
import fetch from './lib/http-client';
const api = require('./api-client');
import { getAuth } from 'firebase/auth';
import admin from 'firebase-admin';
import fs from 'node:fs';
```

## Options

```jsonc
{
  "gigaslop/no-database-packages": [
    "error",
    {
      "allow": ["@supabase/supabase-js"],
      "additionalBlocked": ["some-internal-db-shim"],
      "categories": ["drivers", "orms"]
    }
  ]
}
```

### `allow`

Exact package names to exempt (the name that would appear in `package.json`, not a wildcard). Use this when one listed SDK **is** this project's official data-access layer.

```js
/* eslint gigaslop/no-database-packages: ["error", { "allow": ["@supabase/supabase-js"] }] */

import { createClient } from '@supabase/supabase-js'; // allowed
import { Pool } from 'pg'; // still flagged
```

### `additionalBlocked`

Extra package names or wildcards to block beyond the built-in list. `*` in a pattern matches a single path segment (no `/`).

### `categories`

Restrict enforcement to a subset of built-in categories. Default: all of them.

| Id | Meaning |
| --- | --- |
| `drivers` | database driver |
| `orms` | ORM / query builder |
| `serverless` | serverless/edge database client |
| `baas` | BaaS SDK (direct database access, not the project API) |

```js
/* eslint gigaslop/no-database-packages: ["error", { "categories": ["drivers"] }] */

import { Pool } from 'pg'; // flagged
import x from '@mikro-orm/core'; // allowed (orms not selected)
```

## Built-in blocklist

### `drivers`

`pg`, `postgres`, `pg-promise`, `slonik`, `mysql`, `mysql2`, `mariadb`, `mongodb`, `mongoose`, `better-sqlite3`, `sqlite3`, `sqlite`, `sql.js`, `mssql`, `tedious`, `oracledb`, `redis`, `ioredis`, `cassandra-driver`, `neo4j-driver`, `@clickhouse/client`, `edgedb`, `gel`

### `orms`

`prisma`, `@prisma/client`, `@prisma/adapter-*`, `drizzle-orm`, `drizzle-kit`, `kysely`, `typeorm`, `sequelize`, `sequelize-typescript`, `knex`, `mikro-orm`, `@mikro-orm/*`, `objection`

### `serverless`

`@neondatabase/serverless`, `@vercel/postgres`, `@vercel/kv`, `@planetscale/database`, `@libsql/client`, `@upstash/redis`, `@upstash/vector`, `@tidbcloud/serverless`, `@xata.io/client`, `@electric-sql/pglite`

### `baas`

`@supabase/supabase-js`, `@supabase/ssr`, `firebase/firestore`, `firebase/database`, `firebase/compat/firestore`, `firebase/compat/database`, `@firebase/firestore`, `@firebase/database`, `firebase-admin/firestore`, `firebase-admin/database`, `pocketbase`, `@google-cloud/firestore`, `@google-cloud/bigquery`, `@google-cloud/bigtable`, `@google-cloud/spanner`, `@google-cloud/sql`, `convex`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-rds-data`

## When Not To Use It

Do not enable this rule in a project whose data layer **is** one of the listed packages. Prefer `allow` for a single official SDK rather than turning the rule off.

`firebase/auth` and the root `firebase-admin` entry are **not** blocked (Auth, Storage, Messaging). Firestore/RTDB subpaths are. `allow: ['firebase']` exempts the whole `firebase` package, including `firebase/firestore`.

## Limitations

- Dynamic specifiers (`import(variable)`, `require(name)`) are not checked.
- `package.json` is only checked when the recommended config (or the `packagejson` processor) is enabled. Adding a dependency still requires ESLint to lint that file.
- Cloudflare D1 and similar binding-only APIs have no import to flag.

## Related Rules

- [no-raw-database-apis](./no-raw-database-apis.md) — flags driver-shaped constructors/calls even without a blocked import
- [no-database-env-vars](./no-database-env-vars.md) — flags connection env vars and URI literals
- [no-database-config-files](./no-database-config-files.md) — flags schema/config filenames
