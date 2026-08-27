import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

function literalStringValue(node: TSESTree.Node | null | undefined): string | null {
  if (node && node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return node.value;
  }
  return null;
}

/**
 * Visitors for every specifier form the package-blocklist rules care about:
 * import/export, dynamic import(), require(), require.resolve(), and
 * `import x = require()`.
 */
export function specifierListeners(
  check: (node: TSESTree.Node, source: string) => void,
): TSESLint.RuleListener {
  return {
    ImportDeclaration(node) {
      check(node, node.source.value);
    },
    ExportNamedDeclaration(node) {
      if (node.source) check(node, node.source.value);
    },
    ExportAllDeclaration(node) {
      check(node, node.source.value);
    },
    ImportExpression(node) {
      const value = literalStringValue(node.source);
      if (value) check(node, value);
    },
    TSImportEqualsDeclaration(node) {
      const ref = node.moduleReference;
      if (ref.type === AST_NODE_TYPES.TSExternalModuleReference) {
        const value = literalStringValue(ref.expression);
        if (value) check(node, value);
      }
    },
    CallExpression(node) {
      const { callee } = node;
      const firstArgValue = literalStringValue(node.arguments[0] as TSESTree.Node | undefined);
      if (!firstArgValue) return;

      if (callee.type === AST_NODE_TYPES.Identifier && callee.name === 'require') {
        check(node, firstArgValue);
        return;
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.object.name === 'require' &&
        callee.property.type === AST_NODE_TYPES.Identifier &&
        callee.property.name === 'resolve'
      ) {
        check(node, firstArgValue);
      }
    },
  };
}
