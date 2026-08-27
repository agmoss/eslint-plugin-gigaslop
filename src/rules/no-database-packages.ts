import { createRule } from '../utils/createRule';
import {
  ALL_CATEGORY_IDS,
  PACKAGE_CATEGORIES,
  type PackageCategoryDefinition,
} from '../utils/blocklist';
import {
  findBlockedPattern,
  getPackageNameFromSource,
} from '../utils/matchPackage';
import { attachPackageJsonDependencyCheck } from '../utils/packageJson';
import { specifierListeners } from '../utils/specifierListeners';
import type { TSESTree } from '@typescript-eslint/utils';

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
          allow: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          additionalBlocked: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          categories: {
            type: 'array',
            items: {
              type: 'string',
              enum: ALL_CATEGORY_IDS as unknown as string[],
            },
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
    const activeCategories = new Set<CategoryId>(
      options.categories ?? ALL_CATEGORY_IDS,
    );

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

      const category =
        blocked.find((b) => b.pattern === matched)?.category ??
        'blocked package';
      context.report({
        node,
        messageId: 'blockedPackage',
        data: { packageName, category, matched },
      });
    }

    return attachPackageJsonDependencyCheck(
      context,
      specifierListeners(check),
      check,
    );
  },
});
