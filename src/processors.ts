function stubProgram(): string {
  return ';\n';
}

export interface PluginProcessor {
  meta: { name: string };
  preprocess(text: string, filename: string): Array<{ text: string; filename: string }>;
  postprocess(messages: unknown[][]): unknown[];
}

function createStubProcessor(name: string): PluginProcessor {
  return {
    meta: { name },
    preprocess(_text, filename) {
      return [{ text: stubProgram(), filename }];
    },
    postprocess(messages) {
      return messages.flat();
    },
  };
}

/**
 * Lets ESLint visit non-JS sidecar files (Prisma, SQLite, compose YAML, SQL
 * migrations, JSON stores, `*.db`, `package.json`) so filename and
 * package.json-aware rules can report. Source text is discarded — do not emit
 * `require()` / `import` statements other plugins will lint.
 */
export const stubProcessor: PluginProcessor = createStubProcessor('gigaslop/stub');

/** @deprecated Use stubProcessor — kept so existing plugin keys keep working. */
export const prismaProcessor = stubProcessor;

/**
 * Same no-op stub as {@link stubProcessor}, under the eslintrc processor name
 * `gigaslop/packagejson`. `package.json` dependencies are read from disk in
 * the rules, not rewritten into fake `require()` calls.
 */
export const packageJsonProcessor: PluginProcessor = createStubProcessor('gigaslop/packagejson');
