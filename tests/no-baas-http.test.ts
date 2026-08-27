import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { noBaasHttp } from '../src/rules/no-baas-http';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

test('no-baas-http', () => {
  ruleTester.run('no-baas-http', noBaasHttp as any, {
    valid: [
      "fetch('/api/widgets');",
      "fetch('https://api.example.com/v1/widgets');",
      "const docs = 'https://supabase.com/docs';",
      {
        code: "fetch('https://abc.supabase.co/rest/v1/rows');",
        options: [{ allowHosts: ['supabase.co'] }],
      },
    ],
    invalid: [
      {
        code: "fetch('https://abcdefghij.supabase.co/rest/v1/users');",
        errors: [{ messageId: 'blockedHost' }],
      },
      {
        code: "axios.get('https://ep-cool.region.aws.neon.tech/sql');",
        errors: [{ messageId: 'blockedHost' }],
      },
      {
        code: 'const url = `https://${project}.supabase.co/rest/v1/rows`;',
        errors: [{ messageId: 'blockedHost' }],
      },
      {
        code: "fetch('https://us-east-1.upstash.io');",
        errors: [{ messageId: 'blockedHost' }],
      },
      {
        code: "fetch('https://internal.db.example.com/sql');",
        options: [{ additionalHosts: ['db.example.com'] }],
        errors: [{ messageId: 'blockedHost' }],
      },
    ],
  });
});
