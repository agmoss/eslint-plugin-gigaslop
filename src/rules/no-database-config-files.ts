import { createRule } from '../utils/createRule';
import { DEFAULT_CONFIG_FILE_PATTERNS } from '../utils/blocklist';

export interface Options {
  /** Extra regex source strings (matched against the normalized file path) to flag. */
  patterns?: string[];
}

type RuleOptions = [Options];
type MessageIds = 'blockedConfigFile';

export const noDatabaseConfigFiles = createRule<RuleOptions, MessageIds>({
  name: 'no-database-config-files',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow database schema/config files such as prisma/schema.prisma or drizzle.config.ts — this app has no database of its own to define a schema for.',
    },
    messages: {
      blockedConfigFile:
        "'{{fileName}}' is a database schema/config file. This app talks to the project's existing HTTP APIs and must not define its own database schema.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          patterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const patterns = DEFAULT_CONFIG_FILE_PATTERNS.concat(options.patterns ?? []).map(
      (source) => new RegExp(source, 'i'),
    );

    return {
      Program(node) {
        const rawFileName = context.filename ?? context.getFilename();
        const fileName = rawFileName.replace(/\\/g, '/');
        if (fileName === '<input>' || fileName === '<text>') return;

        if (patterns.some((pattern) => pattern.test(fileName))) {
          context.report({ node, messageId: 'blockedConfigFile', data: { fileName } });
        }
      },
    };
  },
});
