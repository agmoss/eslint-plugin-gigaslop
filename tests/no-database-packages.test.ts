import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { noDatabasePackages } from '../src/rules/no-database-packages';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parser: tsParser,
  },
});

test('no-database-packages', () => {
  ruleTester.run('no-database-packages', noDatabasePackages as any, {
    valid: [
      "import { useState } from 'react';",
      "import fetch from './lib/http-client';",
      "const api = require('./api-client');",
      "import fs from 'node:fs';",
      "import { getAuth } from 'firebase/auth';",
      "import admin from 'firebase-admin';",
      {
        code: "import { createClient } from '@supabase/supabase-js';",
        options: [{ allow: ['@supabase/supabase-js'] }],
      },
      {
        code: "import x from '@mikro-orm/core';",
        options: [{ categories: ['drivers'] }],
      },
    ],
    invalid: [
      {
        code: "import { Pool } from 'pg';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import parser from 'pg/lib/parser';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "const { Client } = require('pg');",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "require.resolve('mongoose');",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "export * from 'drizzle-orm';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "export { db } from '@prisma/client';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "async function load() { await import('@vercel/postgres'); }",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import adapter from '@prisma/adapter-neon';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import core from '@mikro-orm/core';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { createClient } from '@supabase/supabase-js';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { getFirestore } from 'firebase/firestore';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { getFirestore } from 'firebase-admin/firestore';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { DatabaseSync } from 'node:sqlite';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { Database } from 'bun:sqlite';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import neo4j from 'neo4j-driver';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import x from 'not-blocked'; import y from 'pg';",
        options: [{ additionalBlocked: ['not-blocked'] }],
        errors: [{ messageId: 'blockedPackage' }, { messageId: 'blockedPackage' }],
      },
      {
        code: "import x = require('mysql');",
        errors: [{ messageId: 'blockedPackage' }],
      },
    ],
  });
});
