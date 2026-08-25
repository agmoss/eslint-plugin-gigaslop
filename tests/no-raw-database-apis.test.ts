import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { noRawDatabaseApis } from '../src/rules/no-raw-database-apis';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

test('no-raw-database-apis', () => {
  ruleTester.run('no-raw-database-apis', noRawDatabaseApis as any, {
    valid: [
      'const workerPool = new WorkerPool();',
      'fetch("/api/widgets").then((res) => res.json());',
      'const client = new ApiClient();',
    ],
    invalid: [
      {
        code: 'const pool = new Pool({ connectionString: url });',
        errors: [{ messageId: 'blockedConstructor' }],
      },
      {
        code: 'const client = new MongoClient(uri);',
        errors: [{ messageId: 'blockedConstructor' }],
      },
      {
        code: 'const conn = createConnection(config);',
        errors: [{ messageId: 'blockedCall' }],
      },
      {
        code: 'const conn = mysql.createConnection(config);',
        errors: [{ messageId: 'blockedCall' }],
      },
      {
        code: 'const client = redis.createClient(config);',
        errors: [{ messageId: 'blockedCall' }],
      },
      {
        code: 'await MongoClient.connect(uri);',
        errors: [{ messageId: 'blockedMongoConnect' }],
      },
      {
        code: 'const s3 = new S3Client(config);',
        options: [{ additionalConstructors: ['S3Client'] }],
        errors: [{ messageId: 'blockedConstructor' }],
      },
    ],
  });
});
