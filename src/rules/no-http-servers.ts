import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import {
  ALL_SERVER_CATEGORY_IDS,
  SERVER_CATEGORIES,
  type ServerCategoryDefinition,
} from '../utils/blocklist';
import { findBlockedPattern, getPackageNameFromSource } from '../utils/matchPackage';
import { attachPackageJsonDependencyCheck } from '../utils/packageJson';
import { specifierListeners } from '../utils/specifierListeners';

type CategoryId = ServerCategoryDefinition['id'];

export interface Options {
  allow?: string[];
  additionalBlocked?: string[];
  /** Restrict to `"http"` and/or `"graphql"` (default: both). */
  categories?: CategoryId[];
}

type RuleOptions = [Options];
type MessageIds = 'blockedPackage';

export const noHttpServers = createRule<RuleOptions, MessageIds>({
  name: 'no-http-servers',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow standing up a new HTTP or GraphQL server in this app — call the existing project APIs instead of adding another process.',
    },
    messages: {
      blockedPackage:
        "'{{packageName}}' is a {{category}} (matched '{{matched}}'). This app must call the project's existing HTTP APIs — do not start a second backend. If this really is the official server for this repo, add it to `allow` or turn this rule off.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          additionalBlocked: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          categories: {
            type: 'array',
            items: { type: 'string', enum: ALL_SERVER_CATEGORY_IDS as unknown as string[] },
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
    const activeCategories = new Set<CategoryId>(options.categories ?? ALL_SERVER_CATEGORY_IDS);

    const blocked: Array<{ pattern: string; category: string }> = [];
    for (const category of SERVER_CATEGORIES) {
      if (!activeCategories.has(category.id)) continue;
      for (const pkg of category.packages) {
        blocked.push({ pattern: pkg, category: category.label });
      }
    }
    for (const pkg of options.additionalBlocked ?? []) {
      blocked.push({ pattern: pkg, category: 'blocked server package' });
    }
    const blockedPatterns = blocked.map((entry) => entry.pattern);

    function check(node: TSESTree.Node, source: string): void {
      const packageName = getPackageNameFromSource(source);
      if (!packageName || allow.has(packageName)) return;

      const matched = findBlockedPattern(packageName, blockedPatterns, source);
      if (!matched) return;

      const category = blocked.find((entry) => entry.pattern === matched)?.category ?? 'blocked server package';
      context.report({
        node,
        messageId: 'blockedPackage',
        data: { packageName, category, matched },
      });
    }

    return attachPackageJsonDependencyCheck(context, specifierListeners(check), check);
  },
});
