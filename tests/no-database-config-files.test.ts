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
      { code: 'export const config = {};', filename: 'src/db-client-config.ts' },
    ],
    invalid: [
      {
        code: '// prisma schema placeholder',
        filename: 'prisma/schema.prisma',
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
    ],
  });
});
