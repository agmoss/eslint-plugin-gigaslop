import { readFileSync } from 'node:fs';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface FilenameContext {
  filename?: string;
  physicalFilename?: string;
  getFilename?: () => string;
  getPhysicalFilename?: () => string;
}

export function isPackageJsonFilename(filename: string): boolean {
  const normalized = filename.replace(/\\/g, '/');
  return normalized === 'package.json' || normalized.endsWith('/package.json');
}

export function resolveLintFilename(context: FilenameContext): string {
  const raw =
    context.physicalFilename ??
    context.getPhysicalFilename?.() ??
    context.filename ??
    context.getFilename?.() ??
    '';
  return raw.replace(/\\/g, '/');
}

function dependencyNames(pkg: PackageJsonShape): string[] {
  return [
    ...new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ]),
  ];
}

/**
 * Reads dependency names from the real `package.json` on disk.
 * Processors must not rewrite this file into `require()` / `import` statements
 * other plugins will lint.
 */
export function readPackageJsonDependencyNames(filename: string): string[] {
  if (!isPackageJsonFilename(filename)) return [];

  try {
    const parsed = JSON.parse(
      readFileSync(filename, 'utf8'),
    ) as PackageJsonShape;
    return dependencyNames(parsed);
  } catch {
    return [];
  }
}

/**
 * Runs `check` once per `package.json` dependency on `Program`, after any
 * existing Program listener (filename rules, etc.).
 */
export function attachPackageJsonDependencyCheck(
  context: FilenameContext,
  listeners: TSESLint.RuleListener,
  check: (node: TSESTree.Node, source: string) => void,
): TSESLint.RuleListener {
  const previousProgram = listeners.Program;

  return {
    ...listeners,
    Program(node) {
      if (typeof previousProgram === 'function') {
        previousProgram(node);
      }

      const filename = resolveLintFilename(context);
      if (!isPackageJsonFilename(filename)) return;

      for (const name of readPackageJsonDependencyNames(filename)) {
        check(node, name);
      }
    },
  };
}
