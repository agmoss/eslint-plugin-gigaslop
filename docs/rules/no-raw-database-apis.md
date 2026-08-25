# gigaslop/no-raw-database-apis

Disallow raw database connection patterns (`new Pool()` / `new Client()`, `createConnection()`, `MongoClient.connect()`, …) even when the driver was not imported through a recognizable blocked package name.

This rule is **not** included in `recommended` or `recommended-legacy`. Identifier matching false-positives on ordinary `Client` / `createClient` APIs (discord.js, Redis, MinIO, Elasticsearch, HTTP wrappers). Enable it explicitly if you want that extra net on top of [no-database-packages](./no-database-packages.md):

```js
export default [
  ...gigaslop.configs.recommended,
  { rules: { 'gigaslop/no-raw-database-apis': 'error' } },
];
```

## Rule Details

Matches **identifier names** on `new` expressions and call expressions. It does not resolve where the binding came from, so a re-export or alias that still uses these names is flagged — and so is any non-database API that happens to use the same name.

Default constructors (`new Name(...)`):

- `Pool`
- `Client`
- `MongoClient`

Default calls (`Name(...)` or `obj.Name(...)`):

- `createConnection`
- `createPool`
- `createClient`

Also flagged: `MongoClient.connect(...)`.

`new obj.Pool()` is **not** flagged (the callee is a member expression, not an identifier). Rely on [no-database-packages](./no-database-packages.md) for `import { Pool } from 'pg'` followed by `new pg.Pool()`.

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-raw-database-apis: "error" */

const pool = new Pool({ connectionString: url });
const client = new MongoClient(uri);
const conn = createConnection(config);
const mysqlConn = mysql.createConnection(config);
const redisClient = redis.createClient(config);
await MongoClient.connect(uri);
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-raw-database-apis: "error" */

const workerPool = new WorkerPool();
const client = new ApiClient();
fetch('/api/widgets').then((res) => res.json());
```

## Options

```jsonc
{
  "gigaslop/no-raw-database-apis": [
    "error",
    {
      "additionalConstructors": ["S3Client"],
      "additionalCalls": ["createSession"]
    }
  ]
}
```

### `additionalConstructors`

Extra identifier names treated as `new Name(...)` database constructors.

```js
/* eslint gigaslop/no-raw-database-apis: ["error", { "additionalConstructors": ["S3Client"] }] */

const s3 = new S3Client(config); // flagged
```

### `additionalCalls`

Extra identifier or method names treated as `Name(...)` / `obj.Name(...)` factory calls.

## When Not To Use It

Do not enable this rule if the codebase uses any of these names for non-database types. Common collisions:

| Name | Also used by |
| --- | --- |
| `Client` | discord.js, Elasticsearch, MQTT, SSH, many HTTP wrappers |
| `Pool` | generic worker / connection pools |
| `createClient` | Redis, MinIO, GraphQL, OpenAI-style SDKs, custom HTTP clients |
| `createConnection` | AMQP, WebSockets, TypeORM-style helpers |

If this app's HTTP layer is named `Client` or `createClient`, keep [no-database-packages](./no-database-packages.md) and turn this rule off.

## Limitations

- Matching is by identifier spelling only; there is no import tracking.
- `new pg.Pool()` and `new foo.Client()` are not reported.
- Computed members (`obj['createClient']()`) are not reported.

## Related Rules

- [no-database-packages](./no-database-packages.md) — flags the import even when the local binding is renamed
- [no-database-env-vars](./no-database-env-vars.md) — flags connection env vars and URI literals
- [no-database-config-files](./no-database-config-files.md) — flags schema/config filenames
