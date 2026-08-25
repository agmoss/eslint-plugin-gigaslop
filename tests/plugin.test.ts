import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import plugin from '../src/index';

function createLinter(): ESLint {
  return new ESLint({
    overrideConfigFile: true,
    // Plugin configs are loosely typed; ESLint's Config generic doesn't accept them directly.
    overrideConfig: plugin.configs.recommended as never,
  });
}

async function lint(filePath: string, code: string) {
  const [result] = await createLinter().lintText(code, { filePath });
  assert.ok(result, `expected a lint result for ${filePath}`);
  return result;
}

test('recommended loads through the public plugin entry and flags a blocked import', async () => {
  const result = await lint('src/db.js', "import { Pool } from 'pg';\n");
  assert.equal(result.fatalErrorCount, 0);
  assert.ok(
    result.messages.some((message) => message.ruleId === 'gigaslop/no-database-packages'),
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

test('recommended lints *.prisma via the prisma processor', async () => {
  const result = await lint('prisma/schema.prisma', 'model User {}\n');
  assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
  assert.ok(
    result.messages.some((message) => message.ruleId === 'gigaslop/no-database-config-files'),
    `expected no-database-config-files, got ${JSON.stringify(result.messages)}`,
  );
});

test('recommended lints package.json dependencies via the package-json processor', async () => {
  const result = await lint('package.json', JSON.stringify({ dependencies: { pg: '^8.0.0' } }));
  assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
  assert.ok(
    result.messages.some((message) => message.ruleId === 'gigaslop/no-database-packages'),
    `expected no-database-packages, got ${JSON.stringify(result.messages)}`,
  );
});

test('recommended-legacy names processors eslintrc can resolve', () => {
  const legacy = plugin.configs['recommended-legacy'];
  assert.deepEqual(legacy.plugins, ['gigaslop']);
  assert.equal(legacy.overrides[0]?.processor, 'gigaslop/prisma');
  assert.equal(legacy.overrides[1]?.processor, 'gigaslop/packagejson');
  assert.ok(plugin.processors.prisma);
  assert.ok(plugin.processors.packagejson);
});

test('CJS export exposes processors on the module root for eslintrc', (t) => {
  const distCjs = fileURLToPath(new URL('../dist/index.cjs', import.meta.url));
  if (!existsSync(distCjs)) {
    t.skip('dist/index.cjs not built');
    return;
  }
  const required = createRequire(import.meta.url)(distCjs) as typeof plugin;
  assert.ok(required.processors?.prisma, 'CJS require() is missing processors — eslintrc will fail');
  assert.equal(required.configs['recommended-legacy']?.overrides[0]?.processor, 'gigaslop/prisma');
});
