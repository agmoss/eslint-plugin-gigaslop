import type { TSESTree } from '@typescript-eslint/utils';
import { createRule, type PathOptions } from '../utils/createRule';
import {
  ALL_SPREADSHEET_CATEGORY_IDS,
  SPREADSHEET_CATEGORIES,
  type SpreadsheetCategoryDefinition,
} from '../utils/blocklist';
import {
  findBlockedPattern,
  getPackageNameFromSource,
} from '../utils/matchPackage';
import { attachPackageJsonDependencyCheck } from '../utils/packageJson';
import { specifierListeners } from '../utils/specifierListeners';

type CategoryId = SpreadsheetCategoryDefinition['id'];

export interface Options extends PathOptions {
  /** Packages to exempt, e.g. when CSV/Excel import-export is an approved feature. */
  allow?: string[];
  /** Extra packages/wildcards to block beyond the built-in list. */
  additionalBlocked?: string[];
  /** Restrict enforcement to `"csv"` and/or `"excel"` (default: both). */
  categories?: CategoryId[];
}

type RuleOptions = [Options];
type MessageIds = 'blockedPackage';

export const noSpreadsheetPackages = createRule<RuleOptions, MessageIds>({
  name: 'no-spreadsheet-packages',
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow importing/requiring CSV or Excel/spreadsheet libraries — this app must call the project's existing HTTP APIs instead of parsing or generating spreadsheets itself.",
    },
    messages: {
      blockedPackage:
        "'{{packageName}}' is a {{category}} (matched '{{matched}}'). This app must call the project's existing HTTP APIs — do not parse, generate, or embed CSV/Excel here. If this library really is approved, add it to `allow` or turn this rule off.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedPaths: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
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
              enum: ALL_SPREADSHEET_CATEGORY_IDS as unknown as string[],
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
      options.categories ?? ALL_SPREADSHEET_CATEGORY_IDS,
    );

    const blocked: Array<{ pattern: string; category: string }> = [];
    for (const category of SPREADSHEET_CATEGORIES) {
      if (!activeCategories.has(category.id)) continue;
      for (const pkg of category.packages) {
        blocked.push({ pattern: pkg, category: category.label });
      }
    }
    for (const pkg of options.additionalBlocked ?? []) {
      blocked.push({ pattern: pkg, category: 'blocked spreadsheet package' });
    }
    const blockedPatterns = blocked.map((entry) => entry.pattern);

    function check(node: TSESTree.Node, source: string): void {
      const packageName = getPackageNameFromSource(source);
      if (!packageName || allow.has(packageName)) return;

      const matched = findBlockedPattern(packageName, blockedPatterns, source);
      if (!matched) return;

      const category =
        blocked.find((entry) => entry.pattern === matched)?.category ??
        'blocked spreadsheet package';
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
