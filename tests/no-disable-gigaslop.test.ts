import { test } from 'node:test';
import { RuleTester } from 'eslint';
import plugin from '../src/index';
import { noDisableGigaslop } from '../src/rules/no-disable-gigaslop';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  // Disable comments name `gigaslop/…`; ESLint errors if those rules are undefined.
  plugins: { gigaslop: plugin as never },
  linterOptions: {
    reportUnusedDisableDirectives: false,
  },
});

test('no-disable-gigaslop', () => {
  ruleTester.run('no-disable-gigaslop', noDisableGigaslop as any, {
    valid: [
      'const x = 1;',
      '// eslint-disable-next-line no-console\nconsole.log(1);',
      '/* eslint-disable no-unused-vars */\nconst y = 2;',
      {
        code: '/* eslint-disable */\nconst z = 3;',
      },
    ],
    invalid: [
      {
        code: '/* eslint-disable gigaslop/no-database-packages */\nconst x = 1;',
        errors: [{ messageId: 'disabledPlugin' }],
      },
      {
        code: '// eslint-disable-next-line gigaslop/no-raw-sql\nconst q = 1;',
        errors: [{ messageId: 'disabledPlugin' }],
      },
      {
        code: '// eslint-disable-next-line gigaslop/no-http-servers\nconst app = 1;',
        errors: [{ messageId: 'disabledPlugin' }],
      },
      {
        code: '// eslint-disable-next-line\nconst z = 3;',
        options: [{ banUnqualifiedDisable: true }],
        errors: [{ messageId: 'unqualifiedDisable' }],
      },
    ],
  });
});
