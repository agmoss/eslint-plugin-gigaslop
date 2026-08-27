import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import plugin from '../src/index';

function createLinter(
  overrideConfig: unknown = plugin.configs.recommended,
): ESLint {
  return new ESLint({
    overrideConfigFile: true,
    // Plugin configs are loosely typed; ESLint's Config generic doesn't accept them directly.
    overrideConfig: overrideConfig as never,
  });
}

async function lint(filePath: string, code: string, overrideConfig?: unknown) {
  const [result] = await createLinter(overrideConfig).lintText(code, {
    filePath,
  });
  assert.ok(result, `expected a lint result for ${filePath}`);
  return result;
}

test('recommended is a JS/TS overlay and does not add sidecar files globs', () => {
  assert.equal(plugin.configs.recommended.length, 1);
  assert.equal(plugin.configs.recommended[0]?.files, undefined);
  assert.ok(
    plugin.configs['recommended-sidecars'].some((entry) =>
      entry.files?.includes('**/data/**/*.json'),
    ),
    'expected recommended-sidecars to own the data/**/*.json glob',
  );
});

test('recommended loads through the public plugin entry and flags a blocked import', async () => {
  const result = await lint('src/db.js', "import { Pool } from 'pg';\n");
  assert.equal(result.fatalErrorCount, 0);
  assert.ok(
    result.messages.some(
      (message) => message.ruleId === 'gigaslop/no-database-packages',
    ),
    `expected no-database-packages, got ${JSON.stringify(result.messages)}`,
  );
});

test('recommended does not enable no-raw-database-apis (Client false positives)', async () => {
  const result = await lint('src/bot.js', 'const client = new Client();\n');
  assert.equal(result.fatalErrorCount, 0);
  assert.equal(result.messages.length, 0);
  assert.equal(
    plugin.configs.recommended[0]?.rules?.['gigaslop/no-raw-database-apis'],
    undefined,
  );
});

test('recommended-sidecars lints *.prisma via the stub processor', async () => {
  const result = await lint(
    'prisma/schema.prisma',
    'model User {}\n',
    plugin.configs['recommended-sidecars'],
  );
  assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
  assert.ok(
    result.messages.some(
      (message) => message.ruleId === 'gigaslop/no-database-config-files',
    ),
    `expected no-database-config-files, got ${JSON.stringify(result.messages)}`,
  );
});

test('recommended flags file-backed datastore packages and writes in JS', async () => {
  const lowdb = await lint('src/store.js', "import { Low } from 'lowdb';\n");
  assert.ok(
    lowdb.messages.some(
      (message) => message.ruleId === 'gigaslop/no-fs-datastore',
    ),
    `expected no-fs-datastore on lowdb, got ${JSON.stringify(lowdb.messages)}`,
  );

  const write = await lint(
    'src/save.js',
    "fs.writeFileSync('data/users.json', JSON.stringify(users));\n",
  );
  assert.ok(
    write.messages.some(
      (message) => message.ruleId === 'gigaslop/no-fs-datastore',
    ),
    `expected no-fs-datastore on writeFile, got ${JSON.stringify(write.messages)}`,
  );
});

test('recommended-sidecars flags sidecar JSON stores', async () => {
  const json = await lint(
    'data/users.json',
    '{"users":[]}\n',
    plugin.configs['recommended-sidecars'],
  );
  assert.equal(json.fatalErrorCount, 0, JSON.stringify(json.messages));
  assert.ok(
    json.messages.some(
      (message) => message.ruleId === 'gigaslop/no-fs-datastore',
    ),
    `expected no-fs-datastore on data/users.json, got ${JSON.stringify(json.messages)}`,
  );
});

test('recommended flags BaaS HTTP, raw SQL, HTTP servers, and gigaslop disables', async () => {
  const supabase = await lint(
    'src/client.js',
    "fetch('https://abc.supabase.co/rest/v1/users');\n",
  );
  assert.ok(
    supabase.messages.some(
      (message) => message.ruleId === 'gigaslop/no-baas-http',
    ),
  );

  const sql = await lint('src/query.js', "const q = 'SELECT * FROM users';\n");
  assert.ok(
    sql.messages.some((message) => message.ruleId === 'gigaslop/no-raw-sql'),
  );

  const express = await lint(
    'src/server.js',
    "import express from 'express';\n",
  );
  assert.ok(
    express.messages.some(
      (message) => message.ruleId === 'gigaslop/no-http-servers',
    ),
  );

  const disable = await lint(
    'src/escape.js',
    '/* eslint-disable gigaslop/no-database-packages */\nconst x = 1;\n',
  );
  assert.ok(
    disable.messages.some(
      (message) => message.ruleId === 'gigaslop/no-disable-gigaslop',
    ),
  );
});

test('recommended-sidecars lints sqlite and docker-compose sidecar files', async () => {
  const sqlite = await lint(
    'data/app.sqlite',
    '',
    plugin.configs['recommended-sidecars'],
  );
  assert.equal(sqlite.fatalErrorCount, 0, JSON.stringify(sqlite.messages));
  assert.ok(
    sqlite.messages.some(
      (message) => message.ruleId === 'gigaslop/no-database-config-files',
    ),
    `expected config-files on sqlite, got ${JSON.stringify(sqlite.messages)}`,
  );

  const compose = await lint(
    'docker-compose.yml',
    'services:\n  db:\n    image: postgres\n',
    plugin.configs['recommended-sidecars'],
  );
  assert.equal(compose.fatalErrorCount, 0, JSON.stringify(compose.messages));
  assert.ok(
    compose.messages.some(
      (message) => message.ruleId === 'gigaslop/no-database-config-files',
    ),
    `expected config-files on compose, got ${JSON.stringify(compose.messages)}`,
  );
});

test('recommended-legacy names processors eslintrc can resolve', () => {
  const legacy = plugin.configs['recommended-legacy'];
  assert.deepEqual(legacy.plugins, ['gigaslop']);
  assert.equal(legacy.overrides[0]?.processor, 'gigaslop/stub');
  assert.equal(legacy.overrides[1]?.processor, 'gigaslop/packagejson');
  assert.ok(plugin.processors.stub);
  assert.ok(plugin.processors.packagejson);
});

test('packagejson processor emits a no-op stub, not require()', () => {
  const [chunk] = plugin.processors.packagejson.preprocess(
    JSON.stringify({ dependencies: { pg: '^8.0.0' } }),
    'package.json',
  );
  assert.ok(chunk);
  assert.equal(chunk.filename, 'package.json');
  assert.equal(chunk.text.trim(), ';');
  assert.equal(chunk.text.includes('require'), false);
});

test('CJS export exposes processors on the module root for eslintrc', (t) => {
  const distCjs = fileURLToPath(new URL('../dist/index.cjs', import.meta.url));
  if (!existsSync(distCjs)) {
    t.skip('dist/index.cjs not built');
    return;
  }
  const required = createRequire(import.meta.url)(distCjs) as typeof plugin;
  assert.ok(
    required.processors?.prisma,
    'CJS require() is missing processors — eslintrc will fail',
  );
  assert.equal(
    required.configs['recommended-legacy']?.overrides[0]?.processor,
    'gigaslop/stub',
  );
});
