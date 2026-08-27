import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import {
  DEFAULT_FS_DATASTORE_FILE_PATTERNS,
  DEFAULT_FS_DATASTORE_WRITE_EXTRA_PATTERNS,
  FS_DATASTORE_PACKAGES,
} from '../utils/blocklist';
import { findBlockedPattern, getPackageNameFromSource } from '../utils/matchPackage';
import { attachPackageJsonDependencyCheck } from '../utils/packageJson';
import { specifierListeners } from '../utils/specifierListeners';

export interface Options {
  allow?: string[];
  additionalBlocked?: string[];
  /** Extra regex source strings matched against the linted filename and fs write paths. */
  additionalFilePatterns?: string[];
  /** Set false to only flag packages and datastore filenames, not `writeFile('data/*.json')`. */
  checkFsWrites?: boolean;
}

type RuleOptions = [Options];
type MessageIds = 'blockedPackage' | 'blockedDataFile' | 'blockedFsWrite';

const FS_WRITE_NAMES = new Set([
  'writeFile',
  'writeFileSync',
  'appendFile',
  'appendFileSync',
  'writeTextFile',
  'writeTextFileSync',
  'outputFile',
  'outputFileSync',
  'outputJson',
  'outputJsonSync',
  'outputJSON',
  'outputJSONSync',
  'writeJson',
  'writeJSON',
  'writeJsonSync',
  'writeJSONSync',
]);

function compilePatterns(sources: readonly string[]): RegExp[] {
  return sources.map((source) => new RegExp(source, 'i'));
}

function matchesAny(value: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function isPathJoinCallee(callee: TSESTree.Expression): boolean {
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name === 'join' || callee.name === 'resolve';
  }
  return (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.computed &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    (callee.property.name === 'join' || callee.property.name === 'resolve')
  );
}

function staticPathHint(node: TSESTree.Node | undefined): string | null {
  if (!node) return null;

  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return node.value;
  }

  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    return node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join('x');
  }

  if (node.type === AST_NODE_TYPES.CallExpression && isPathJoinCallee(node.callee)) {
    const parts: string[] = [];
    for (const arg of node.arguments) {
      if (arg.type === AST_NODE_TYPES.Literal && typeof arg.value === 'string') {
        parts.push(arg.value);
      }
    }
    return parts.length > 0 ? parts.join('/') : null;
  }

  return null;
}

function isFsWriteCall(node: TSESTree.CallExpression): boolean {
  const { callee } = node;

  if (callee.type === AST_NODE_TYPES.Identifier) {
    return FS_WRITE_NAMES.has(callee.name);
  }

  if (callee.type === AST_NODE_TYPES.MemberExpression && !callee.computed) {
    if (callee.property.type !== AST_NODE_TYPES.Identifier) return false;
    if (FS_WRITE_NAMES.has(callee.property.name)) return true;
    if (callee.object.type === AST_NODE_TYPES.Identifier && callee.object.name === 'Bun' && callee.property.name === 'write') {
      return true;
    }
    if (
      callee.object.type === AST_NODE_TYPES.Identifier &&
      callee.object.name === 'Deno' &&
      (callee.property.name === 'writeFile' ||
        callee.property.name === 'writeTextFile' ||
        callee.property.name === 'writeTextFileSync')
    ) {
      return true;
    }
  }

  return false;
}

export const noFsDatastore = createRule<RuleOptions, MessageIds>({
  name: 'no-fs-datastore',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow file-backed datastores (lowdb, Level, NeDB, data/*.json, *.db) — this app must call existing HTTP APIs instead of using the filesystem as a database.',
    },
    messages: {
      blockedPackage:
        "'{{packageName}}' is a file-backed datastore (matched '{{matched}}'). This app may only call the project's existing HTTP APIs — do not keep source-of-truth data in local files.",
      blockedDataFile:
        "'{{fileName}}' looks like a file-backed datastore. This app talks to the project's existing HTTP APIs and must not keep source-of-truth data in local files.",
      blockedFsWrite:
        "Writing '{{path}}' looks like a file-backed datastore. Call the project's existing HTTP APIs instead of using the filesystem as a database.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          additionalBlocked: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          additionalFilePatterns: { type: 'array', items: { type: 'string' } },
          checkFsWrites: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const allow = new Set(options.allow ?? []);
    const blockedPatterns = FS_DATASTORE_PACKAGES.concat(options.additionalBlocked ?? []);
    const extraFilePatterns = options.additionalFilePatterns ?? [];
    const filePatterns = compilePatterns(DEFAULT_FS_DATASTORE_FILE_PATTERNS.concat(extraFilePatterns));
    const writePatterns = compilePatterns(
      DEFAULT_FS_DATASTORE_FILE_PATTERNS.concat(DEFAULT_FS_DATASTORE_WRITE_EXTRA_PATTERNS).concat(extraFilePatterns),
    );
    const checkFsWrites = options.checkFsWrites !== false;

    function checkPackage(node: TSESTree.Node, source: string): void {
      const packageName = getPackageNameFromSource(source);
      if (!packageName || allow.has(packageName)) return;

      const matched = findBlockedPattern(packageName, blockedPatterns, source);
      if (!matched) return;

      context.report({
        node,
        messageId: 'blockedPackage',
        data: { packageName, matched },
      });
    }

    const packageListeners = specifierListeners(checkPackage);

    return attachPackageJsonDependencyCheck(
      context,
      {
        ...packageListeners,
        Program(node) {
          const rawFileName = context.filename ?? context.getFilename();
          const fileName = rawFileName.replace(/\\/g, '/');
          if (fileName === '<input>' || fileName === '<text>') return;

          if (matchesAny(fileName, filePatterns)) {
            context.report({ node, messageId: 'blockedDataFile', data: { fileName } });
          }
        },
        CallExpression(node) {
          const onPackageCall = packageListeners.CallExpression;
          if (typeof onPackageCall === 'function') onPackageCall(node);

          if (!checkFsWrites || !isFsWriteCall(node)) return;

          const pathHint = staticPathHint(node.arguments[0]);
          if (!pathHint) return;

          const normalized = normalizePath(pathHint);
          if (matchesAny(normalized, writePatterns)) {
            context.report({ node, messageId: 'blockedFsWrite', data: { path: normalized } });
          }
        },
      },
      checkPackage,
    );
  },
});
