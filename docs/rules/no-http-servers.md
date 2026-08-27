# gigaslop/no-http-servers

Disallow standing up a new HTTP or GraphQL server in this app. Call the existing project APIs instead of adding another process.

This rule is included in `recommended` and `recommended-legacy` at `"error"`.

If **this repo is the HTTP server**, turn the rule off (or `allow` the framework).

## Rule Details

Same specifier coverage as [no-database-packages](./no-database-packages.md) (`import` / `require` / `import()` / `package.json` via the recommended processor).

### `http`

`express`, `fastify`, `hono`, `koa`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/platform-fastify`, `elysia`, `restify`, `polka`, `micro`, `@hapi/hapi`, `connect`

### `graphql`

`@apollo/server`, `apollo-server`, `apollo-server-express`, `apollo-server-fastify`, `graphql-yoga`, `@graphql-yoga/node`, `mercurius`, `nexus`, `type-graphql`

The `graphql` **client** package is not blocked.

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-http-servers: "error" */

import express from "express";
import { Hono } from "hono";
import { ApolloServer } from "@apollo/server";
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-http-servers: "error" */

import { NextRequest } from "next/server";
fetch("/api/widgets");
```

## Options

```jsonc
{
  "gigaslop/no-http-servers": [
    "error",
    {
      "allow": ["express"],
      "additionalBlocked": ["tinyhttp"],
      "categories": ["http"],
    },
  ],
}
```

## Related Rules

- [no-database-packages](./no-database-packages.md)
