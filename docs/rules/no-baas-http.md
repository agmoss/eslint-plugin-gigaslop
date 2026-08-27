# gigaslop/no-baas-http

Disallow HTTP URLs that talk to a BaaS or database HTTP API (Supabase REST, Neon, Upstash, …) instead of the project's existing APIs.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

## Rule Details

Flags string literals and template literals whose value contains a blocked hostname. Relative URLs (`/api/widgets`) and unrelated hosts are allowed.

This exists because agents skip the SDK blocklist and `fetch('https://….supabase.co/rest/v1/…')` instead.

Default hosts: `supabase.co`, `supabase.in`, `neon.tech`, `psdb.cloud`, `planetscale.com`, `upstash.io`, `firebaseio.com`, `firestore.googleapis.com`, `convex.cloud`, `turso.io`, `tursodatabase.com`, `xata.sh`, `xata.io`, `tidbcloud.com`, `mongodb.net`, `rds.amazonaws.com`.

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-baas-http: "error" */

fetch('https://abcdefghij.supabase.co/rest/v1/users');
axios.get('https://ep-cool.region.aws.neon.tech/sql');
const url = `https://${project}.supabase.co/rest/v1/rows`;
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-baas-http: "error" */

fetch('/api/widgets');
fetch('https://api.example.com/v1/widgets');
```

## Options

```jsonc
{
  "gigaslop/no-baas-http": ["error", {
    "additionalHosts": ["db.internal.example.com"],
    "allowHosts": ["supabase.co"]
  }]
}
```

## Related Rules

- [no-database-packages](./no-database-packages.md) — flags the SDK import
- [no-raw-sql](./no-raw-sql.md) — flags SQL strings sent over those HTTP APIs
