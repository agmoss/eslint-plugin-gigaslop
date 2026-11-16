import { ESLintUtils } from '@typescript-eslint/utils';
import { posix, win32 } from 'node:path';

export interface PathOptions {
  /** Exact file paths exempt from this rule, relative to ESLint's cwd or absolute. */
  allowedPaths?: string[];
}

const createBaseRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/agmoss/gigaslop/blob/main/docs/rules/${name}.md`,
);

export function createRule<
  Options extends [PathOptions],
  MessageIds extends string,
>(rule: Readonly<ESLintUtils.RuleWithMetaAndName<Options, MessageIds>>) {
  return createBaseRule<Options, MessageIds>({
    ...rule,
    create(context, options) {
      const filename =
        context.physicalFilename ?? context.getPhysicalFilename();
      const cwd = context.cwd ?? context.getCwd();
      if (filename !== '<input>' && filename !== '<text>') {
        const normalizedFilename = filename.replace(/\\/g, '/');
        const normalizedCwd = cwd.replace(/\\/g, '/');
        const paths = /^[a-z]:\//i.test(normalizedFilename) ? win32 : posix;
        const absoluteFilename = paths.resolve(
          normalizedCwd,
          normalizedFilename,
        );
        const allowed = options[0].allowedPaths?.some((entry) => {
          const relative = paths.relative(
            paths.resolve(normalizedCwd, entry.replace(/\\/g, '/')),
            absoluteFilename,
          );
          return relative === '';
        });
        if (allowed) return {};
      }
      return rule.create(context, options);
    },
  });
}
