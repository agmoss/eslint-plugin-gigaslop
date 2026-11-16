import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import plugin from '../src/index';

const cases = {
  'no-database-packages': "import pg from 'pg';",
  'no-database-env-vars': 'const url = process.env.DATABASE_URL;',
  'no-raw-database-apis': 'const client = new Pool();',
  'no-database-config-files': 'const config = {};',
  'no-baas-http': "fetch('https://abc.supabase.co/rest/v1/users');",
  'no-raw-sql': "const query = 'SELECT * FROM users';",
  'no-http-servers': "import express from 'express';",
  'no-disable-gigaslop': '/* eslint-disable gigaslop/no-database-packages */',
  'no-fs-datastore': "import { Low } from 'lowdb';",
  'no-spreadsheet-packages': "import Papa from 'papaparse';",
};

function linter(rule: string, allowedPaths: unknown, cwd = process.cwd()) {
  return new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: {
      plugins: { gigaslop: plugin as never },
      linterOptions: { reportUnusedDisableDirectives: false },
      rules: { [`gigaslop/${rule}`]: ['error', { allowedPaths }] },
    },
  });
}

for (const [rule, code] of Object.entries(cases)) {
  test(`${rule} accepts allowedPaths and only skips matching paths`, async () => {
    const eslint = linter(rule, ['approved/nested/drizzle.config.js']);
    for (const directory of ['approved', 'restricted', 'approved-other']) {
      const [result] = await eslint.lintText(code, {
        filePath: `${directory}/nested/drizzle.config.js`,
      });
      assert.ok(result);
      assert.equal(result.fatalErrorCount, 0);
      assert.equal(
        result.messages.filter(
          (message) => message.ruleId === `gigaslop/${rule}`,
        ).length > 0,
        directory !== 'approved',
      );
    }
  });
}

test('allowedPaths matches exact files, normalized file paths and absolute paths', async () => {
  for (const entry of [
    'approved/query.js',
    './approved/nested/../query.js',
    'approved\\query.js',
    resolve('approved/query.js'),
  ]) {
    const eslint = linter('no-raw-sql', [entry]);
    const [result] = await eslint.lintText(cases['no-raw-sql'], {
      filePath: 'approved/query.js',
    });
    assert.equal(result?.messages.length, 0, entry);
  }
  const eslint = linter('no-raw-sql', ['approved/query.js']);
  const [result] = await eslint.lintText(cases['no-raw-sql'], {
    filePath: 'approved/query.js.backup.js',
  });
  assert.equal(result?.errorCount, 1);
});

test('directory entries and globs do not exempt files', async () => {
  for (const entry of [
    'approved',
    'approved/',
    '.',
    'approved/*',
    'approved/**',
    '**/*.js',
  ]) {
    const [result] = await linter('no-raw-sql', [entry]).lintText(
      cases['no-raw-sql'],
      {
        filePath: 'approved/query.js',
      },
    );
    assert.equal(result?.errorCount, 1, entry);
  }
});

test('an empty allowedPaths array still enforces the rule', async () => {
  const [result] = await linter('no-raw-sql', []).lintText(cases['no-raw-sql']);
  assert.equal(result?.errorCount, 1);
});

test('allowedPaths only exempts the configured rule', async () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      ...plugin.configs.recommended,
      {
        rules: {
          'gigaslop/no-database-packages': [
            'error',
            { allowedPaths: ['approved/query.js'] },
          ],
        },
      },
    ] as never,
  });
  const [result] = await eslint.lintText(
    `${cases['no-database-packages']}\n${cases['no-raw-sql']}`,
    { filePath: 'approved/query.js' },
  );
  assert.deepEqual(
    result?.messages.map((message) => message.ruleId),
    ['gigaslop/no-raw-sql'],
  );
});

test('allowedPaths uses ESLint cwd and physical paths for processed sidecars', async () => {
  const cwd = fileURLToPath(
    new URL('./fixtures/next-unscoped-rules', import.meta.url),
  );
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [
      ...plugin.configs['recommended-sidecars'],
      {
        rules: {
          'gigaslop/no-database-packages': [
            'error',
            { allowedPaths: ['package.json'] },
          ],
          'gigaslop/no-database-config-files': [
            'error',
            { allowedPaths: ['prisma/schema.prisma'] },
          ],
        },
      },
    ] as never,
  });
  const results = await eslint.lintFiles([
    'package.json',
    'prisma/schema.prisma',
    'data/app.sqlite',
  ]);
  const messages = results.flatMap((result) => result.messages);
  assert.ok(!messages.some((message) => message.fatal));
  assert.ok(
    !messages.some(
      (message) => message.ruleId === 'gigaslop/no-database-packages',
    ),
  );
  assert.equal(
    messages.filter(
      (message) => message.ruleId === 'gigaslop/no-database-config-files',
    ).length,
    1,
  );
});

test('allowedPaths rejects malformed options', async () => {
  for (const allowedPaths of ['approved', [42], ['']]) {
    await assert.rejects(
      linter('no-raw-sql', allowedPaths).lintText(cases['no-raw-sql']),
      /should (?:be|NOT be)/,
    );
  }
});
