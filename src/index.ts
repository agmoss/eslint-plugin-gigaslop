import { noDatabasePackages } from './rules/no-database-packages';
import { noDatabaseEnvVars } from './rules/no-database-env-vars';
import { noRawDatabaseApis } from './rules/no-raw-database-apis';
import { noDatabaseConfigFiles } from './rules/no-database-config-files';
import { noBaasHttp } from './rules/no-baas-http';
import { noRawSql } from './rules/no-raw-sql';
import { noHttpServers } from './rules/no-http-servers';
import { noDisableGigaslop } from './rules/no-disable-gigaslop';
import { noFsDatastore } from './rules/no-fs-datastore';
import { packageJsonProcessor, stubProcessor } from './processors';

const PLUGIN_NAME = 'gigaslop';

const rules = {
  'no-database-packages': noDatabasePackages,
  'no-database-env-vars': noDatabaseEnvVars,
  'no-raw-database-apis': noRawDatabaseApis,
  'no-database-config-files': noDatabaseConfigFiles,
  'no-baas-http': noBaasHttp,
  'no-raw-sql': noRawSql,
  'no-http-servers': noHttpServers,
  'no-disable-gigaslop': noDisableGigaslop,
  'no-fs-datastore': noFsDatastore,
};

const processors = {
  prisma: stubProcessor,
  '.prisma': stubProcessor,
  stub: stubProcessor,
  packagejson: packageJsonProcessor,
};

const recommendedRuleSettings: Record<string, 'error'> = {
  [`${PLUGIN_NAME}/no-database-packages`]: 'error',
  [`${PLUGIN_NAME}/no-database-env-vars`]: 'error',
  [`${PLUGIN_NAME}/no-database-config-files`]: 'error',
  [`${PLUGIN_NAME}/no-baas-http`]: 'error',
  [`${PLUGIN_NAME}/no-raw-sql`]: 'error',
  [`${PLUGIN_NAME}/no-http-servers`]: 'error',
  [`${PLUGIN_NAME}/no-disable-gigaslop`]: 'error',
  [`${PLUGIN_NAME}/no-fs-datastore`]: 'error',
};

const SIDECAR_FILES = [
  '**/*.prisma',
  '**/*.sqlite',
  '**/*.sqlite3',
  '**/prisma/migrations/**',
  '**/docker-compose.yml',
  '**/docker-compose.yaml',
  '**/docker-compose.*.yml',
  '**/docker-compose.*.yaml',
  '**/compose.yml',
  '**/compose.yaml',
  '**/*.db',
  '**/*.ldb',
  '**/*.leveldb',
  '**/db.json',
  '**/database.json',
  '**/store.json',
  '**/datastore.json',
  '**/data/**/*.json',
  '**/db/**/*.json',
  '**/database/**/*.json',
  '**/store/**/*.json',
  '**/datastore/**/*.json',
];

/**
 * Deliberately loose shape for a flat ESLint config object — the strict
 * `Linter.Config`/`Linter.Plugin` types from `eslint` don't line up with
 * `@typescript-eslint/utils` rule modules, so we describe just what we need
 * structurally instead of fighting cross-package generics.
 */
interface FlatConfig {
  name?: string;
  files?: string[];
  plugins?: Record<string, unknown>;
  processor?: string | object;
  rules?: Record<string, string>;
}

interface AgentDbBlocklistPlugin {
  meta: { name: string; version: string };
  rules: typeof rules;
  processors: typeof processors;
  configs: {
    recommended: FlatConfig[];
    'recommended-sidecars': FlatConfig[];
    'recommended-legacy': {
      plugins: string[];
      rules: Record<string, string>;
      overrides: Array<{
        files: string[];
        processor: string;
      }>;
    };
  };
}

const plugin: AgentDbBlocklistPlugin = {
  meta: {
    name: 'eslint-plugin-gigaslop',
    version: '0.4.0',
  },
  rules,
  processors,
  configs: {
    recommended: [],
    'recommended-sidecars': [],
    'recommended-legacy': {
      plugins: [PLUGIN_NAME],
      rules: recommendedRuleSettings,
      overrides: [
        {
          files: SIDECAR_FILES,
          processor: `${PLUGIN_NAME}/stub`,
        },
        {
          files: ['**/package.json'],
          processor: `${PLUGIN_NAME}/packagejson`,
        },
      ],
    },
  },
};

plugin.configs.recommended = [
  {
    name: `${PLUGIN_NAME}/recommended`,
    plugins: { [PLUGIN_NAME]: plugin },
    rules: recommendedRuleSettings,
  },
];

plugin.configs['recommended-sidecars'] = [
  {
    name: `${PLUGIN_NAME}/recommended-sidecars/sidecar-files`,
    files: SIDECAR_FILES,
    plugins: { [PLUGIN_NAME]: plugin },
    processor: stubProcessor,
    rules: {
      [`${PLUGIN_NAME}/no-database-config-files`]: 'error',
      [`${PLUGIN_NAME}/no-fs-datastore`]: 'error',
    },
  },
  {
    name: `${PLUGIN_NAME}/recommended-sidecars/package-json`,
    files: ['**/package.json'],
    plugins: { [PLUGIN_NAME]: plugin },
    processor: packageJsonProcessor,
    rules: {
      [`${PLUGIN_NAME}/no-database-packages`]: 'error',
      [`${PLUGIN_NAME}/no-http-servers`]: 'error',
      [`${PLUGIN_NAME}/no-fs-datastore`]: 'error',
    },
  },
];

export default plugin;
export { rules, processors };
export const meta = plugin.meta;
export const configs = plugin.configs;
