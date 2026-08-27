# gigaslop/no-disable-gigaslop

Disallow `eslint-disable` comments that turn off gigaslop rules. Agents must not silence this plugin to add a database or second backend.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

## Rule Details

Reports comments of the form:

- `eslint-disable`
- `eslint-disable-next-line`
- `eslint-disable-line`

when the rule list includes `gigaslop` or any `gigaslop/…` rule.

Unqualified disables (`eslint-disable` with no rule list) are **not** flagged unless you set `banUnqualifiedDisable`. Those are common on generated files.

If this app is allowed to own a database or HTTP server, change plugin options (`allow`, turn a rule off in config) instead of disabling inline.

ESLint still honors a disable of **this** rule (`eslint-disable gigaslop/no-disable-gigaslop`). That is a remaining escape hatch; unqualified `eslint-disable` is another unless `banUnqualifiedDisable` is on.

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-disable-gigaslop: "error" */

/* eslint-disable gigaslop/no-database-packages */
// eslint-disable-next-line gigaslop/no-raw-sql
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-disable-gigaslop: "error" */

// eslint-disable-next-line no-console
console.log(1);
```

## Options

```jsonc
{
  "gigaslop/no-disable-gigaslop": ["error", {
    "banUnqualifiedDisable": false
  }]
}
```

## Related Rules

- [no-database-packages](./no-database-packages.md)
- [no-http-servers](./no-http-servers.md)
