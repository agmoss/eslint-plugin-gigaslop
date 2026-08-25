/**
 * Resolves an import/require source string down to the package name that
 * would appear in package.json, so subpath imports (e.g. `pg/lib/foo`,
 * `@mikro-orm/core/utils`) still match the blocklist.
 */
const RUNTIME_SPECIFIER = /^(?:node|bun|npm|jsr):/;

export function getPackageNameFromSource(source: string): string | null {
  if (!source) return null;
  // Relative, absolute, or path-alias imports are never npm packages.
  if (source.startsWith('.') || source.startsWith('/') || source.startsWith('~')) return null;

  const bare = source.replace(RUNTIME_SPECIFIER, '');
  if (!bare) return null;

  const segments = bare.split('/');
  if (bare.startsWith('@')) {
    if (segments.length < 2 || segments[1] === '') return null;
    return `${segments[0]}/${segments[1]}`;
  }
  return segments[0] ?? null;
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${escaped}$`);
}

function matchesPattern(candidate: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    return wildcardToRegExp(pattern).test(candidate);
  }
  if (candidate === pattern) return true;
  // Subpath of a more specific entry, e.g. firebase/firestore/lite.
  return pattern.includes('/') && candidate.startsWith(`${pattern}/`);
}

/**
 * Returns the blocklist entry a package name or import specifier matched
 * (which may be a wildcard like `@mikro-orm/*` or a subpath like
 * `firebase/firestore`), or null if none matched.
 */
export function findBlockedPattern(
  packageName: string,
  patterns: readonly string[],
  source: string = packageName,
): string | null {
  const candidates = source === packageName ? [packageName] : [source, packageName];
  for (const candidate of candidates) {
    for (const pattern of patterns) {
      if (matchesPattern(candidate, pattern)) return pattern;
    }
  }
  return null;
}
