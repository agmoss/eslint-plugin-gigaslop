import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/agmoss/gigaslop/blob/main/docs/rules/${name}.md`,
);
