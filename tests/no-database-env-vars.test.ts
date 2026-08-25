import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { noDatabaseEnvVars } from '../src/rules/no-database-env-vars';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

test('no-database-env-vars', () => {
  ruleTester.run('no-database-env-vars', noDatabaseEnvVars as any, {
    valid: [
      'const url = process.env.API_BASE_URL;',
      'const { API_BASE_URL } = process.env;',
      "const msg = 'hello world';",
      'const host = process.env.API_HOST;',
      {
        code: 'const url = process.env.POSTGRES_PRISMA_URL;',
        options: [{ checkDefaultPattern: false }],
      },
    ],
    invalid: [
      {
        code: 'const url = process.env.DATABASE_URL;',
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: "const url = process.env['POSTGRES_URL'];",
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: 'const { MONGODB_URI } = process.env;',
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: 'const url = process.env.POSTGRES_PRISMA_URL;',
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: 'const host = process.env.PGHOST;',
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: 'const url = import.meta.env.DATABASE_URL;',
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: 'const url = env.DATABASE_URL;',
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: 'const { DATABASE_URL } = env;',
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: "const url = Deno.env.get('DATABASE_URL');",
        errors: [{ messageId: 'blockedEnvVar' }],
      },
      {
        code: "const conn = 'postgres://user:pass@host:5432/db';",
        errors: [{ messageId: 'blockedConnectionString' }],
      },
      {
        code: "const conn = 'mongodb+srv://user:pass@cluster.mongodb.net/db';",
        errors: [{ messageId: 'blockedConnectionString' }],
      },
      {
        code: 'const conn = `postgres://${user}@host/db`;',
        errors: [{ messageId: 'blockedConnectionString' }],
      },
      {
        code: "const conn = 'postgres://' + host;",
        errors: [{ messageId: 'blockedConnectionString' }],
      },
      {
        code: 'const url = process.env.MY_CUSTOM_DB_URL;',
        options: [{ envVars: ['MY_CUSTOM_DB_URL'] }],
        errors: [{ messageId: 'blockedEnvVar' }],
      },
    ],
  });
});
