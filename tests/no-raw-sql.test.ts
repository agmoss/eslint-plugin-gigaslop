import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { noRawSql } from '../src/rules/no-raw-sql';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

test('no-raw-sql', () => {
  ruleTester.run('no-raw-sql', noRawSql as any, {
    valid: [
      "const label = 'select a winner';",
      "const copy = 'update the UI after save';",
      "const msg = 'delete this comment';",
      'const html = css`color: red;`;',
      {
        code: "const q = 'SELECT * FROM users';",
        options: [{ checkLiterals: false }],
      },
    ],
    invalid: [
      {
        code: "const q = 'SELECT * FROM users';",
        errors: [{ messageId: 'blockedSqlLiteral' }],
      },
      {
        code: "const q = 'INSERT INTO widgets (name) VALUES ($1)';",
        errors: [{ messageId: 'blockedSqlLiteral' }],
      },
      {
        code: 'const q = sql`SELECT * FROM users WHERE id = ${id}`;',
        errors: [{ messageId: 'blockedSqlTag' }],
      },
      {
        code: 'const q = db.sql`SELECT 1`;',
        errors: [{ messageId: 'blockedSqlTag' }],
      },
      {
        code: 'const q = Bun.sql`SELECT 1`;',
        errors: [{ messageId: 'blockedSqlTag' }],
      },
      {
        code: 'const q = `SELECT name FROM ${table}`;',
        errors: [{ messageId: 'blockedSqlLiteral' }],
      },
    ],
  });
});
