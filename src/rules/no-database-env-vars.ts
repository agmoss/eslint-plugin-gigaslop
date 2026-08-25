import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import {
  DEFAULT_BLOCKED_ENV_VARS,
  DEFAULT_CONNECTION_STRING_PATTERN,
  DEFAULT_ENV_VAR_PATTERN,
} from '../utils/blocklist';

export interface Options {
  /** Exact env var names to block, beyond the defaults. */
  envVars?: string[];
  /** Extra regex source(s) matched against env var names. */
  envVarPatterns?: string[];
  /** Set false to disable the built-in fallback pattern for env var names. */
  checkDefaultPattern?: boolean;
  /** Set false to disable flagging bare connection-string literals (postgres://, mongodb://, ...). */
  checkConnectionStrings?: boolean;
}

type RuleOptions = [Options];
type MessageIds = 'blockedEnvVar' | 'blockedConnectionString';

function getStaticPropertyName(node: TSESTree.MemberExpression): string | null {
  if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
    return node.property.name;
  }
  if (node.computed && node.property.type === AST_NODE_TYPES.Literal && typeof node.property.value === 'string') {
    return node.property.value;
  }
  return null;
}

function objectPatternKeyName(property: TSESTree.Property): string | null {
  const key = property.key;
  if (key.type === AST_NODE_TYPES.Identifier) return key.name;
  if (key.type === AST_NODE_TYPES.Literal && typeof key.value === 'string') return key.value;
  return null;
}

/** `Deno.env.get('…')` */
function isDenoEnvGet(callee: TSESTree.CallExpression['callee']): boolean {
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.computed) return false;
  if (callee.property.type !== AST_NODE_TYPES.Identifier || callee.property.name !== 'get') return false;
  const obj = callee.object;
  return (
    obj.type === AST_NODE_TYPES.MemberExpression &&
    !obj.computed &&
    obj.object.type === AST_NODE_TYPES.Identifier &&
    obj.object.name === 'Deno' &&
    obj.property.type === AST_NODE_TYPES.Identifier &&
    obj.property.name === 'env'
  );
}

function firstTemplateQuasi(node: TSESTree.TemplateLiteral): string | null {
  const cooked = node.quasis[0]?.value.cooked;
  return typeof cooked === 'string' ? cooked : null;
}

export const noDatabaseEnvVars = createRule<RuleOptions, MessageIds>({
  name: 'no-database-env-vars',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reading database connection env vars (DATABASE_URL, POSTGRES_URL, ...) or hardcoding database connection-string literals.',
    },
    messages: {
      blockedEnvVar:
        "Reading '{{name}}' looks like wiring up a direct database connection. This app may only talk to the project's existing HTTP APIs — remove this env var access.",
      blockedConnectionString:
        'This string literal looks like a database connection string. Do not connect to a database directly — call the existing project API instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          envVars: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          envVarPatterns: { type: 'array', items: { type: 'string' } },
          checkDefaultPattern: { type: 'boolean' },
          checkConnectionStrings: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const blockedNames = new Set(DEFAULT_BLOCKED_ENV_VARS.concat(options.envVars ?? []));
    const patterns = [
      ...(options.checkDefaultPattern === false ? [] : [DEFAULT_ENV_VAR_PATTERN]),
      ...(options.envVarPatterns ?? []),
    ].map((source) => new RegExp(source));
    const checkConnectionStrings = options.checkConnectionStrings !== false;
    const connectionStringRegExp = new RegExp(DEFAULT_CONNECTION_STRING_PATTERN, 'i');

    function isBlockedName(name: string): boolean {
      if (blockedNames.has(name)) return true;
      return patterns.some((pattern) => pattern.test(name));
    }

    function reportName(node: TSESTree.Node, name: string): void {
      if (isBlockedName(name)) {
        context.report({ node, messageId: 'blockedEnvVar', data: { name } });
      }
    }

    function reportIfConnectionString(node: TSESTree.Node, value: string | null): void {
      if (!checkConnectionStrings || value === null) return;
      if (connectionStringRegExp.test(value)) {
        context.report({ node, messageId: 'blockedConnectionString' });
      }
    }

    return {
      // process.env.DATABASE_URL, import.meta.env.DATABASE_URL, env.DATABASE_URL
      MemberExpression(node) {
        const name = getStaticPropertyName(node);
        if (name) reportName(node, name);
      },
      // const { DATABASE_URL } = process.env | env | config
      VariableDeclarator(node) {
        if (node.id.type !== AST_NODE_TYPES.ObjectPattern) return;
        for (const property of node.id.properties) {
          if (property.type !== AST_NODE_TYPES.Property) continue;
          const name = objectPatternKeyName(property);
          if (name) reportName(property, name);
        }
      },
      CallExpression(node) {
        if (!isDenoEnvGet(node.callee)) return;
        const first = node.arguments[0];
        if (first?.type === AST_NODE_TYPES.Literal && typeof first.value === 'string') {
          reportName(node, first.value);
        }
      },
      Literal(node) {
        if (typeof node.value === 'string') reportIfConnectionString(node, node.value);
      },
      TemplateLiteral(node) {
        reportIfConnectionString(node, firstTemplateQuasi(node));
      },
    };
  },
});
