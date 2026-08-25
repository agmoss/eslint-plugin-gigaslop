import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
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
