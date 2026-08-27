import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

export interface Options {
  /** Extra identifier names to treat as `new X(...)` database constructors. */
  additionalConstructors?: string[];
  /** Extra identifier/method names to treat as `x(...)` / `obj.x(...)` database factory calls. */
  additionalCalls?: string[];
}

type RuleOptions = [Options];
type MessageIds = 'blockedConstructor' | 'blockedCall' | 'blockedMongoConnect';

/** `new Pool(...)`, `new Client(...)`, `new MongoClient(...)` — raw driver connections. */
const DEFAULT_CONSTRUCTORS = ['Pool', 'Client', 'MongoClient'];

/** `createConnection(...)`, `createPool(...)`, `createClient(...)` — as bare calls or `obj.method(...)`. */
const DEFAULT_CALLS = ['createConnection', 'createPool', 'createClient'];

function getIdentifierName(node: TSESTree.Node): string | null {
  return node.type === AST_NODE_TYPES.Identifier ? node.name : null;
}

export const noRawDatabaseApis = createRule<RuleOptions, MessageIds>({
  name: 'no-raw-database-apis',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw database connection patterns (new Pool()/Client(), createConnection(), MongoClient.connect(), ...) even when the driver was not imported through a recognizable package name.',
    },
    messages: {
      blockedConstructor:
        "'new {{name}}(...)' looks like it opens a direct database connection. This app may only call the project's existing HTTP APIs.",
      blockedCall:
        "'{{name}}(...)' looks like it opens a direct database connection. This app may only call the project's existing HTTP APIs.",
      blockedMongoConnect:
        "'MongoClient.connect(...)' opens a direct database connection. This app may only call the project's existing HTTP APIs.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          additionalConstructors: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          additionalCalls: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const constructors = new Set(
      DEFAULT_CONSTRUCTORS.concat(options.additionalConstructors ?? []),
    );
    const calls = new Set(DEFAULT_CALLS.concat(options.additionalCalls ?? []));

    return {
      NewExpression(node) {
        const name = getIdentifierName(node.callee);
        if (name && constructors.has(name)) {
          context.report({
            node,
            messageId: 'blockedConstructor',
            data: { name },
          });
        }
      },
      CallExpression(node) {
        const { callee } = node;

        if (callee.type === AST_NODE_TYPES.Identifier) {
          if (calls.has(callee.name)) {
            context.report({
              node,
              messageId: 'blockedCall',
              data: { name: callee.name },
            });
          }
          return;
        }

        if (
          callee.type === AST_NODE_TYPES.MemberExpression &&
          !callee.computed
        ) {
          const objectName = getIdentifierName(callee.object);
          const propertyName =
            callee.property.type === AST_NODE_TYPES.Identifier
              ? callee.property.name
              : null;
          if (!propertyName) return;

          if (objectName === 'MongoClient' && propertyName === 'connect') {
            context.report({ node, messageId: 'blockedMongoConnect' });
            return;
          }

          if (calls.has(propertyName)) {
            context.report({
              node,
              messageId: 'blockedCall',
              data: { name: propertyName },
            });
          }
        }
      },
    };
  },
});
