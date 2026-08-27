import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // tsup injects `baseUrl: '.'` into the DTS compiler options, which TS 6
  // treats as a deprecation error even when the project tsconfig never set it.
  // https://github.com/egoist/tsup/issues/1388
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
  clean: true,
  sourcemap: true,
  target: 'node18',
  // eslintrc (`plugin:gigaslop/...`) require()s the CJS build and reads
  // processors/rules/configs off the module root. tsup otherwise emits
  // `{ default: plugin, configs, rules }`, so processors are missing.
  footer: ({ format }) =>
    format === 'cjs'
      ? {
          js: [
            'module.exports = module.exports.default;',
            'module.exports.default = module.exports;',
          ].join('\n'),
        }
      : undefined,
});
