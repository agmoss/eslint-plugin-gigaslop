import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { noHttpServers } from '../src/rules/no-http-servers';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parser: tsParser,
  },
});

test('no-http-servers', () => {
  ruleTester.run('no-http-servers', noHttpServers as any, {
    valid: [
      "import { NextRequest } from 'next/server';",
      {
        code: "import express from 'express';",
        options: [{ allow: ['express'] }],
      },
      {
        code: "import yoga from 'graphql-yoga';",
        options: [{ categories: ['http'] }],
      },
    ],
    invalid: [
      {
        code: "import express from 'express';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { Hono } from 'hono';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "const app = require('fastify')();",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { NestFactory } from '@nestjs/core';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { ApolloServer } from '@apollo/server';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { createYoga } from 'graphql-yoga';",
        errors: [{ messageId: 'blockedPackage' }],
      },
    ],
  });
});
