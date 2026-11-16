# gigaslop/no-spreadsheet-packages

Disallow importing or requiring CSV parsers/writers and Excel/spreadsheet libraries. Export, import, and grid editing of tabular data belong on the project's existing HTTP APIs, not in a new client-side spreadsheet stack.

This rule is included in `recommended` and `recommended-legacy` at `"error"`. `package.json` dependencies are checked when `configs["recommended-sidecars"]` (or the `packagejson` processor) is enabled.

If spreadsheet import/export **is** an approved feature of this repo, `allow` that library or turn the rule off.

## Rule Details

Same specifier coverage as [no-database-packages](./no-database-packages.md):

- `import ... from '…'`
- `export … from '…'` / `export * from '…'`
- dynamic `import('…')` with a string literal
- `require('…')` and `require.resolve('…')` with a string literal
- TypeScript `import x = require('…')`
- dependency names in `package.json` via `recommended-sidecars`

Subpath imports still match the package (`csv-parse/sync` → `csv-parse`, `xlsx/dist/xlsx.mini.min.js` → `xlsx`). A `*` matches one path segment (`@fast-csv/*` matches `@fast-csv/parse`; `@univerjs/sheets*` matches `@univerjs/sheets-ui`).

`d3` itself is not blocked. `d3-dsv` is, because that package is the CSV/TSV parser.

### `csv`

`papaparse`, `react-papaparse`, `babyparse`, `csv`, `csv-parse`, `csv-stringify`, `csv-generate`, `csv-parser`, `csv-writer`, `csvtojson`, `csv2json`, `csv-string`, `csv-load-sync`, `fast-csv`, `@fast-csv/*`, `neat-csv`, `json2csv`, `@json2csv/*`, `json-2-csv`, `d3-dsv`, `objects-to-csv`, `export-to-csv`, `react-csv`, `jquery-csv`, `comma-separated-values`

### `excel`

`xlsx`, `xlsx-js-style`, `xlsx-style`, `sheetjs`, `sheetjs-style`, `@e965/xlsx`, `exceljs`, `node-xlsx`, `xlsx-populate`, `excel4node`, `write-excel-file`, `read-excel-file`, `convert-excel-to-json`, `excel-as-json`, `node-excel-export`, `excel-export`, `json-as-xlsx`, `xlsx-template`, `xlsx-import`, `better-xlsx`, `zipcelx`, `xlsx-writestream`, `xlsx-calc`, `xls`, `handsontable`, `@handsontable/*`, `hyperformula`, `jspreadsheet-ce`, `@jspreadsheet-ce/*`, `jexcel`, `luckysheet`, `luckyexcel`, `@fortune-sheet/*`, `@univerjs/sheets*`, `@univerjs/preset-sheets*`, `react-export-excel`, `react-excel-renderer`

Examples of **incorrect** code:

```js
/* eslint gigaslop/no-spreadsheet-packages: "error" */

import Papa from "papaparse";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { HotTable } from "@handsontable/react";
```

Examples of **correct** code:

```js
/* eslint gigaslop/no-spreadsheet-packages: "error" */

import { useState } from "react";
import { csv } from "./lib/export";
import * as d3 from "d3";
fetch("/api/reports/export");
```

## Options

This rule also accepts [`allowedPaths`](../../README.md#allowedpaths-all-rules) to exempt individual files by exact path.

```jsonc
{
  "gigaslop/no-spreadsheet-packages": [
    "error",
    {
      "allow": ["papaparse"],
      "additionalBlocked": ["my-internal-xlsx"],
      "categories": ["csv", "excel"],
    },
  ],
}
```

### `allow`

Exact package names to exempt (the name that would appear in `package.json`, not a wildcard).

### `additionalBlocked`

Extra package names or wildcards to block beyond the built-in list. `*` matches a single path segment (no `/`).

### `categories`

Restrict enforcement to `"csv"`, `"excel"`, or both. Default: both.

```js
/* eslint gigaslop/no-spreadsheet-packages: ["error", { "categories": ["csv"] }] */

import Papa from "papaparse"; // flagged
import ExcelJS from "exceljs"; // allowed
```

## When Not To Use It

Turn the rule off, or `allow` the one library, when this repository's job is spreadsheet import/export. Hand-rolled `split(',')` CSV and `Blob` downloads are not flagged; this rule only blocks the libraries.

## Limitations

- Dynamic specifiers (`import(variable)`, `require(name)`) are not checked.
- `package.json` is only checked when `configs["recommended-sidecars"]` (or the `packagejson` processor) is enabled.
- A local wrapper (`./lib/sheets`) that re-exports a blocked package is not flagged at the call site. The wrapper's own import is.

## Related Rules

- [no-database-packages](./no-database-packages.md) — drivers, ORMs, and BaaS SDKs
- [no-fs-datastore](./no-fs-datastore.md) — file-backed JSON/Level/NeDB stores
