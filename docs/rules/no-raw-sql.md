# gigaslop/no-raw-sql

Disallow raw SQL strings and `sql\`...\`` tagged templates. This app must not query a database directly.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

## Rule Details

Two checks:

1. **Tagged templates** whose tag is `sql`, `SQL`, or `obj.sql` / `Bun.sql` (any content).
2. **Untagged** string literals and templates that match a conservative SQL shape: `SELECT … FROM`, `INSERT INTO`, `UPDATE … SET`, `DELETE FROM`, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, `TRUNCATE`, `EXPLAIN SELECT`, optional leading `WITH`.

English phrases like "select a winner" or "update the UI" are not flagged.

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-raw-sql: "error" */

const q = 'SELECT * FROM users';
const q2 = sql`SELECT * FROM users WHERE id = ${id}`;
const q3 = Bun.sql`SELECT 1`;
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-raw-sql: "error" */

const label = 'select a winner';
const copy = 'update the UI after save';
```

## Options

```jsonc
{
  "gigaslop/no-raw-sql": ["error", {
    "additionalTags": ["query"],
    "checkLiterals": true
  }]
}
```

Set `checkLiterals` to `false` to only flag tagged templates.

## Related Rules

- [no-database-packages](./no-database-packages.md)
- [no-baas-http](./no-baas-http.md)
