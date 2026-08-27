import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { noDatabaseConfigFiles } from '../src/rules/no-database-config-files';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

test('no-database-config-files', () => {
  ruleTester.run('no-database-config-files', noDatabaseConfigFiles as any, {
    valid: [
      { code: 'export const config = {};', filename: 'app/config.ts' },
      {
        code: 'export const config = {};',
        filename: 'src/db-client-config.ts',
      },
    ],
    invalid: [
      {
        code: '// prisma schema placeholder',
        filename: 'prisma/schema.prisma',
        errors: [{ messageId: 'blockedConfigFile' }],
      },
      {
        code: '-- migration',
        filename: 'prisma/migrations/20240101_init/migration.sql',
        errors: [{ messageId: 'blockedConfigFile' }],
      },
      {
        code: 'export default {};',
        filename: 'drizzle.config.ts',
        errors: [{ messageId: 'blockedConfigFile' }],
      },
      {
        code: 'export default {};',
        filename: 'apps/web/drizzle.config.mjs',
        errors: [{ messageId: 'blockedConfigFile' }],
      },
      {
        code: 'export default {};',
        filename: 'apps/web/custom.schema.prisma',
        errors: [{ messageId: 'blockedConfigFile' }],
      },
      {
        code: '',
        filename: 'data/app.sqlite',
        errors: [{ messageId: 'blockedConfigFile' }],
      },
      {
        code: 'services: {}\n',
        filename: 'docker-compose.yml',
        errors: [{ messageId: 'blockedConfigFile' }],
      },
      {
        code: 'services: {}\n',
        filename: 'compose.yaml',
        errors: [{ messageId: 'blockedConfigFile' }],
      },
    ],
  });
});
