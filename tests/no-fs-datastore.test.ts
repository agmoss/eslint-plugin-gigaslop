import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { noFsDatastore } from '../src/rules/no-fs-datastore';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parser: tsParser,
  },
});

test('no-fs-datastore', () => {
  ruleTester.run('no-fs-datastore', noFsDatastore as any, {
    valid: [
      "import { readFile } from 'node:fs/promises';",
      "import fs from 'node:fs';\nfs.writeFileSync('README.md', '# hi');\n",
      "fs.writeFileSync('src/generated/output.json', '{}');\n",
      "fs.readFileSync('data/users.json', 'utf8');\n",
      {
        code: "import { Low } from 'lowdb';",
        options: [{ allow: ['lowdb'] }],
      },
      {
        code: "fs.writeFileSync('data/users.json', '{}');\n",
        options: [{ checkFsWrites: false }],
      },
    ],
    invalid: [
      {
        code: "import { Low } from 'lowdb';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { Level } from 'level';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "const Datastore = require('nedb');",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import jsonServer from 'json-server';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import persist from 'node-persist';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "fs.writeFileSync('data/users.json', JSON.stringify(users));\n",
        errors: [{ messageId: 'blockedFsWrite' }],
      },
      {
        code: "await writeFile('db.json', '{}');\n",
        errors: [{ messageId: 'blockedFsWrite' }],
      },
      {
        code: "fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), '{}');\n",
        errors: [{ messageId: 'blockedFsWrite' }],
      },
      {
        code: "await Bun.write('data/store.json', '{}');\n",
        errors: [{ messageId: 'blockedFsWrite' }],
      },
      {
        code: "await Deno.writeTextFile('data/users.json', '{}');\n",
        errors: [{ messageId: 'blockedFsWrite' }],
      },
      {
        code: "fs.writeFileSync('app.sqlite', buf);\n",
        errors: [{ messageId: 'blockedFsWrite' }],
      },
      {
        code: "fs.writeFileSync('cache/items.json', '{}');\n",
        options: [{ additionalFilePatterns: ['(^|/)cache/.+\\.json$'] }],
        errors: [{ messageId: 'blockedFsWrite' }],
      },
      {
        code: '',
        filename: 'data/users.json',
        errors: [{ messageId: 'blockedDataFile' }],
      },
      {
        code: '',
        filename: 'db.json',
        errors: [{ messageId: 'blockedDataFile' }],
      },
      {
        code: '',
        filename: 'var/app.db',
        errors: [{ messageId: 'blockedDataFile' }],
      },
    ],
  });
});
