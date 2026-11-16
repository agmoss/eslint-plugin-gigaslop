import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { noSpreadsheetPackages } from '../src/rules/no-spreadsheet-packages';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parser: tsParser,
  },
});

test('no-spreadsheet-packages', () => {
  ruleTester.run('no-spreadsheet-packages', noSpreadsheetPackages as any, {
    valid: [
      "import { useState } from 'react';",
      "import { csv } from './lib/export';",
      "import * as d3 from 'd3';",
      "import fs from 'node:fs';",
      {
        code: "import Papa from 'papaparse';",
        options: [{ allow: ['papaparse'] }],
      },
      {
        code: "import ExcelJS from 'exceljs';",
        options: [{ categories: ['csv'] }],
      },
    ],
    invalid: [
      {
        code: "import Papa from 'papaparse';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { parse } from 'csv-parse/sync';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "const ExcelJS = require('exceljs');",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "require.resolve('xlsx');",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "export * from 'fast-csv';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "async function load() { await import('@e965/xlsx'); }",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { format } from '@fast-csv/format';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { Parser } from '@json2csv/plainjs';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { HotTable } from '@handsontable/react';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { Workbook } from '@fortune-sheet/react';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import { writeXlsxFile } from 'write-excel-file';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import readXlsxFile from 'read-excel-file';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import xlsx from 'xlsx/dist/xlsx.mini.min.js';",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import x = require('node-xlsx');",
        errors: [{ messageId: 'blockedPackage' }],
      },
      {
        code: "import sheet from 'my-internal-xlsx';",
        options: [{ additionalBlocked: ['my-internal-xlsx'] }],
        errors: [{ messageId: 'blockedPackage' }],
      },
    ],
  });
});
