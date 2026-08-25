import { noDatabasePackages } from './rules/no-database-packages';
import { noDatabaseEnvVars } from './rules/no-database-env-vars';
import { noRawDatabaseApis } from './rules/no-raw-database-apis';
import { noDatabaseConfigFiles } from './rules/no-database-config-files';
import { packageJsonProcessor, prismaProcessor } from './processors';

const PLUGIN_NAME = 'gigaslop';

const rules = {
  'no-database-packages': noDatabasePackages,
  'no-database-env-vars': noDatabaseEnvVars,
  'no-raw-database-apis': noRawDatabaseApis,
  'no-database-config-files': noDatabaseConfigFiles,
};

const processors = {
  prisma: prismaProcessor,
  '.prisma': prismaProcessor,
  packagejson: packageJsonProcessor,
};

const recommendedRuleSettings: Record<string, 'error'> = {
  [`${PLUGIN_NAME}/no-database-packages`]: 'error',
  [`${PLUGIN_NAME}/no-database-env-vars`]: 'error',
  [`${PLUGIN_NAME}/no-database-config-files`]: 'error',
};

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
    version: '0.1.1',
  },
  rules,
  processors,
  configs: {
    // Flat config (ESLint 9+, and ESLint 8 with eslint.config.js).
    recommended: [],
    // Legacy `.eslintrc*` config (`extends: ["plugin:gigaslop/recommended-legacy"]`).
    'recommended-legacy': {
      plugins: [PLUGIN_NAME],
      rules: recommendedRuleSettings,
      overrides: [
        {
          files: ['**/*.prisma'],
          processor: `${PLUGIN_NAME}/prisma`,
        },
        {
          files: ['**/package.json'],
          processor: `${PLUGIN_NAME}/packagejson`,
        },
      ],
    },
  },
};

// Self-referencing flat config: the plugin object must exist before we can
// point `plugins` at it, so this array is built after `plugin` is declared.
plugin.configs.recommended = [
  {
    name: `${PLUGIN_NAME}/recommended`,
    plugins: { [PLUGIN_NAME]: plugin },
    rules: recommendedRuleSettings,
  },
  {
    name: `${PLUGIN_NAME}/recommended/prisma`,
    files: ['**/*.prisma'],
    plugins: { [PLUGIN_NAME]: plugin },
    processor: prismaProcessor,
    rules: {
      [`${PLUGIN_NAME}/no-database-config-files`]: 'error',
    },
  },
  {
    name: `${PLUGIN_NAME}/recommended/package-json`,
    files: ['**/package.json'],
    plugins: { [PLUGIN_NAME]: plugin },
    processor: packageJsonProcessor,
    rules: {
      [`${PLUGIN_NAME}/no-database-packages`]: 'error',
    },
  },
];

export default plugin;
export { rules, processors };
export const meta = plugin.meta;
export const configs = plugin.configs;
