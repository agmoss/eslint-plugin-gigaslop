import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import { DEFAULT_SQL_PATTERN } from '../utils/blocklist';

export interface Options {
  /** Extra identifier names treated as SQL tagged-template tags (`sql`, `SQL`, …). */
  additionalTags?: string[];
  /** Set false to skip untagged string literals / templates. Tagged `sql\`...\`` is still flagged. */
  checkLiterals?: boolean;
}

type RuleOptions = [Options];
type MessageIds = 'blockedSqlLiteral' | 'blockedSqlTag';

const DEFAULT_TAGS = ['sql', 'SQL'];

function looksLikeSql(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

function taggedName(tag: TSESTree.Expression): string | null {
  if (tag.type === AST_NODE_TYPES.Identifier) return tag.name;
  if (
    tag.type === AST_NODE_TYPES.MemberExpression &&
    !tag.computed &&
    tag.property.type === AST_NODE_TYPES.Identifier
  ) {
    return tag.property.name;
  }
  return null;
}

function templateLiteralValue(node: TSESTree.TemplateLiteral): string {
  return node.quasis
    .map((quasi) => quasi.value.cooked ?? quasi.value.raw)
    .join(' ');
}

export const noRawSql = createRule<RuleOptions, MessageIds>({
  name: 'no-raw-sql',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw SQL strings and sql`...` tagged templates — this app must not talk to a database directly.',
    },
    messages: {
      blockedSqlLiteral:
        "This string looks like SQL. This app may only call the project's existing HTTP APIs — do not query a database directly.",
      blockedSqlTag:
        "'{{name}}`...`' is a SQL tagged template. This app may only call the project's existing HTTP APIs.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          additionalTags: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          checkLiterals: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const tags = new Set(DEFAULT_TAGS.concat(options.additionalTags ?? []));
    const checkLiterals = options.checkLiterals !== false;
    const sqlPattern = new RegExp(DEFAULT_SQL_PATTERN, 'i');

    return {
      TaggedTemplateExpression(node) {
        const name = taggedName(node.tag);
        if (name && tags.has(name)) {
          context.report({ node, messageId: 'blockedSqlTag', data: { name } });
        }
      },
      Literal(node) {
        if (!checkLiterals) return;
        if (
          typeof node.value === 'string' &&
          looksLikeSql(node.value, sqlPattern)
        ) {
          context.report({ node, messageId: 'blockedSqlLiteral' });
        }
      },
      TemplateLiteral(node) {
        if (!checkLiterals) return;
        // Parent tagged templates are handled above; skip the inner template.
        if (node.parent?.type === AST_NODE_TYPES.TaggedTemplateExpression)
          return;
        if (looksLikeSql(templateLiteralValue(node), sqlPattern)) {
          context.report({ node, messageId: 'blockedSqlLiteral' });
        }
      },
    };
  },
});
