function stubProgram(): string {
  return ';\n';
}

export interface PluginProcessor {
  meta: { name: string };
  preprocess(text: string, filename: string): Array<{ text: string; filename: string }>;
  postprocess(messages: unknown[][]): unknown[];
}

/**
 * Lets ESLint visit non-JS sidecar files (Prisma, SQLite, compose YAML, SQL
 * migrations, JSON stores, `*.db`) so filename rules can report. Source text
 * is discarded.
 */
export const stubProcessor: PluginProcessor = {
  meta: { name: 'gigaslop/stub' },
  preprocess(_text, filename) {
    return [{ text: stubProgram(), filename }];
  },
  postprocess(messages) {
    return messages.flat();
  },
};

/** @deprecated Use stubProcessor — kept so existing plugin keys keep working. */
export const prismaProcessor = stubProcessor;

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function dependencyNames(pkg: PackageJsonShape): string[] {
  const names = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ]);
  return [...names];
}

function isPackageJsonFilename(filename: string): boolean {
  const normalized = filename.replace(/\\/g, '/');
  return normalized === 'package.json' || normalized.endsWith('/package.json');
}

/**
 * Turns `package.json` dependency names into `require('…')` calls so
 * `no-database-packages` flags blocked packages that were added without an
 * application import.
 */
export const packageJsonProcessor: PluginProcessor = {
  meta: { name: 'gigaslop/packagejson' },
  preprocess(text, filename) {
    if (!isPackageJsonFilename(filename)) {
      return [{ text: stubProgram(), filename }];
    }

    let parsed: PackageJsonShape;
    try {
      parsed = JSON.parse(text) as PackageJsonShape;
    } catch {
      return [{ text: stubProgram(), filename }];
    }

    const requires = dependencyNames(parsed)
      .map((name) => `require(${JSON.stringify(name)});`)
      .join('\n');
    // Suffix .js so ESLint parses the emitted requires as JavaScript, not JSON.
    return [{ text: `${requires}\n${stubProgram()}`, filename: `${filename}.js` }];
  },
  postprocess(messages) {
    return messages.flat();
  },
};
