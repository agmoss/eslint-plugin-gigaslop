import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import plugin from '../src/index';

const fixtureDir = fileURLToPath(new URL('./fixtures/next-unscoped-rules', import.meta.url));

/**
 * Stand-in for eslint-plugin-react-hooks: registered only for JS/TS, the way
 * eslint-config-next scopes it.
 */
const fakeReactHooks = {
  meta: { name: 'eslint-plugin-react-hooks' },
  rules: {
    'some-rule': {
      meta: {
        type: 'suggestion',
        docs: { description: 'noop stand-in for react-hooks/set-state-in-effect' },
        schema: [],
        messages: {},
      },
      create() {
        return {};
      },
    },
  },
};

/**
 * Stand-in for @typescript-eslint/no-require-imports: flags `require()` so a
 * package.json processor that emitted fake requires would fail this test.
 */
const fakeTypeScriptEslint = {
  meta: { name: 'eslint-plugin-typescript-eslint-standin' },
  rules: {
    'no-require-imports': {
      meta: {
        type: 'problem',
        docs: { description: 'flag require() like @typescript-eslint/no-require-imports' },
        schema: [],
        messages: { forbidden: 'require() is not allowed' },
      },
      create(context: { report: (descriptor: { node: unknown; messageId: string }) => void }) {
        return {
          CallExpression(node: { callee: { type: string; name?: string } }) {
            if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },
  },
};

function nextStyleConsumerConfig(gigaslopSlice: unknown[]) {
  return [
    {
      files: ['**/*.{js,ts,tsx}'],
      plugins: { 'react-hooks': fakeReactHooks },
    },
    ...gigaslopSlice,
    {
      rules: {
        'react-hooks/some-rule': 'warn',
      },
    },
  ];
}

function createFixtureLinter(overrideConfig: unknown): ESLint {
  return new ESLint({
    cwd: fixtureDir,
    overrideConfigFile: true,
    overrideConfig: overrideConfig as never,
  });
}

function resultFor(results: ESLint.LintResult[], suffix: string): ESLint.LintResult | undefined {
  return results.find((result) => result.filePath.replace(/\\/g, '/').endsWith(suffix));
}

function ruleIds(result: ESLint.LintResult | undefined): string[] {
  return (result?.messages ?? []).map((message) => message.ruleId).filter((id): id is string => id != null);
}

test('spreading recommended with unscoped react-hooks rules does not crash when sidecar files exist', async () => {
  const eslint = createFixtureLinter(nextStyleConsumerConfig(plugin.configs.recommended));

  const results = await eslint.lintFiles(['.']);
  const fatal = results.flatMap((result) =>
    result.messages.filter((message) => message.fatal || message.message.includes('could not find plugin')),
  );
  assert.equal(fatal.length, 0, `config apply should not throw; messages=${JSON.stringify(fatal)}`);

  assert.equal(
    resultFor(results, 'lib/data/store.json'),
    undefined,
    'recommended must not add sidecar JSON to the lint set',
  );
  assert.equal(resultFor(results, 'package.json'), undefined, 'recommended must not add package.json to the lint set');

  const app = resultFor(results, 'src/app.js');
  assert.ok(app, 'expected src/app.js to be linted');
  assert.equal(app.fatalErrorCount, 0);
});

test('recommended-sidecars flags prisma, sqlite, JSON stores, and package.json deps', async () => {
  const eslint = createFixtureLinter([
    ...plugin.configs['recommended-sidecars'],
    {
      files: ['**/package.json'],
      plugins: { '@typescript-eslint': fakeTypeScriptEslint },
      rules: { '@typescript-eslint/no-require-imports': 'error' },
    },
  ]);

  const results = await eslint.lintFiles(['.']);
  const fatal = results.flatMap((result) => result.messages.filter((message) => message.fatal));
  assert.equal(fatal.length, 0, JSON.stringify(fatal));

  const prisma = resultFor(results, 'prisma/schema.prisma');
  assert.ok(prisma, 'expected prisma/schema.prisma to be linted');
  assert.ok(
    ruleIds(prisma).includes('gigaslop/no-database-config-files'),
    `expected no-database-config-files on prisma, got ${JSON.stringify(prisma.messages)}`,
  );

  const sqlite = resultFor(results, 'data/app.sqlite');
  assert.ok(sqlite, 'expected data/app.sqlite to be linted');
  assert.ok(
    ruleIds(sqlite).includes('gigaslop/no-database-config-files'),
    `expected no-database-config-files on sqlite, got ${JSON.stringify(sqlite.messages)}`,
  );

  const json = resultFor(results, 'lib/data/store.json');
  assert.ok(json, 'expected lib/data/store.json to be linted');
  assert.ok(
    ruleIds(json).includes('gigaslop/no-fs-datastore'),
    `expected no-fs-datastore on store.json, got ${JSON.stringify(json.messages)}`,
  );

  const pkg = resultFor(results, 'package.json');
  assert.ok(pkg, 'expected package.json to be linted');
  assert.equal(pkg.fatalErrorCount, 0, JSON.stringify(pkg.messages));
  assert.ok(
    ruleIds(pkg).includes('gigaslop/no-database-packages'),
    `expected no-database-packages on package.json, got ${JSON.stringify(pkg.messages)}`,
  );
  assert.ok(
    ruleIds(pkg).includes('gigaslop/no-http-servers'),
    `expected no-http-servers on package.json, got ${JSON.stringify(pkg.messages)}`,
  );
  assert.ok(
    ruleIds(pkg).includes('gigaslop/no-fs-datastore'),
    `expected no-fs-datastore on package.json, got ${JSON.stringify(pkg.messages)}`,
  );
  assert.ok(
    !ruleIds(pkg).includes('@typescript-eslint/no-require-imports'),
    `package.json processor must not emit require() for other plugins to lint, got ${JSON.stringify(pkg.messages)}`,
  );
});
