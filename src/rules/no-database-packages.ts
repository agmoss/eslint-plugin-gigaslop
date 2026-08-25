import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import { ALL_CATEGORY_IDS, PACKAGE_CATEGORIES, type PackageCategoryDefinition } from '../utils/blocklist';
import { findBlockedPattern, getPackageNameFromSource } from '../utils/matchPackage';

type CategoryId = PackageCategoryDefinition['id'];

export interface Options {
  /** Packages to exempt, e.g. when one of them *is* the official data layer for this project. */
  allow?: string[];
  /** Extra packages/wildcards to block beyond the built-in list. */
  additionalBlocked?: string[];
  /** Restrict enforcement to a subset of the built-in categories (default: all). */
  categories?: CategoryId[];
}

type RuleOptions = [Options];
type MessageIds = 'blockedPackage';

export const noDatabasePackages = createRule<RuleOptions, MessageIds>({
  name: 'no-database-packages',
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow importing/requiring database drivers, ORMs, or BaaS SDKs — this app must talk to the project's HTTP APIs, not a database directly.",
    },
    messages: {
      blockedPackage:
        "'{{packageName}}' is a {{category}} and is blocked here (matched '{{matched}}'). This app may only call the project's existing HTTP APIs — do not add a direct database layer. If this really is the project's official data-access SDK, add it to this rule's `allow` option.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          additionalBlocked: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          categories: {
            type: 'array',
            items: { type: 'string', enum: ALL_CATEGORY_IDS as unknown as string[] },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const allow = new Set(options.allow ?? []);
    const activeCategories = new Set<CategoryId>(options.categories ?? ALL_CATEGORY_IDS);

    const blocked: Array<{ pattern: string; category: string }> = [];
    for (const category of PACKAGE_CATEGORIES) {
      if (!activeCategories.has(category.id)) continue;
      for (const pkg of category.packages) {
        blocked.push({ pattern: pkg, category: category.label });
      }
    }
    for (const pkg of options.additionalBlocked ?? []) {
      blocked.push({ pattern: pkg, category: 'blocked package' });
    }
    const blockedPatterns = blocked.map((b) => b.pattern);

    function check(node: TSESTree.Node, source: string): void {
      const packageName = getPackageNameFromSource(source);
      if (!packageName || allow.has(packageName)) return;

      const matched = findBlockedPattern(packageName, blockedPatterns, source);
      if (!matched) return;

      const category = blocked.find((b) => b.pattern === matched)?.category ?? 'blocked package';
      context.report({
        node,
        messageId: 'blockedPackage',
        data: { packageName, category, matched },
      });
    }

    function literalStringValue(node: TSESTree.Node | null | undefined): string | null {
      if (node && node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
        return node.value;
      }
      return null;
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        const value = literalStringValue(node.source);
        if (value) check(node, value);
      },
      TSImportEqualsDeclaration(node) {
        const ref = node.moduleReference;
        if (ref.type === AST_NODE_TYPES.TSExternalModuleReference) {
          const value = literalStringValue(ref.expression);
          if (value) check(node, value);
        }
      },
      CallExpression(node) {
        const { callee } = node;
        const firstArgValue = literalStringValue(node.arguments[0] as TSESTree.Node | undefined);
        if (!firstArgValue) return;

        if (callee.type === AST_NODE_TYPES.Identifier && callee.name === 'require') {
          check(node, firstArgValue);
          return;
        }

        if (
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.object.name === 'require' &&
          callee.property.type === AST_NODE_TYPES.Identifier &&
          callee.property.name === 'resolve'
        ) {
          check(node, firstArgValue);
        }
      },
    };
  },
});
