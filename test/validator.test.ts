// Simple test runner for validator tests
import { validateGrid, getRow, getColumn, getBox } from '../src/core/validator.js';
import { parsePuzzleString } from '../src/core/parser.js';
import type { Grid } from '../src/types/grid.js';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(`  ${(error as Error).message}`);
      failed++;
    }
  };
}

function assert(condition: boolean, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertArrayEqual(actual: any[], expected: any[], message?: string) {
  if (actual.length !== expected.length || !actual.every((val, i) => val === expected[i])) {
    throw new Error(message || `Expected [${expected}], got [${actual}]`);
  }
}

// Tests
const tests = [
  test('getRow - extracts correct row', () => {
    const grid = parsePuzzleString('530070000600195000098000060800060003400803001700020006060000280000419005000080079');
    const row0 = getRow(grid, 0);
    assertArrayEqual(row0, [5, 3, 0, 0, 7, 0, 0, 0, 0]);
    
    const row1 = getRow(grid, 1);
    assertArrayEqual(row1, [6, 0, 0, 1, 9, 5, 0, 0, 0]);
  }),

  test('getColumn - extracts correct column', () => {
    const grid = parsePuzzleString('530070000600195000098000060800060003400803001700020006060000280000419005000080079');
    const col0 = getColumn(grid, 0);
    assertArrayEqual(col0, [5, 6, 0, 8, 4, 7, 0, 0, 0]);
    
    const col4 = getColumn(grid, 4);
    // Row positions: 530070000 600195000 098000060 800060003 400803001 700020006 060000280 000419005 000080079
    // Col 4 (index 4): 7, 9, 0, 6, 0, 2, 0, 1, 8
    assertArrayEqual(col4, [7, 9, 0, 6, 0, 2, 0, 1, 8]);
  }),

  test('getBox - extracts correct 3x3 box', () => {
    const grid = parsePuzzleString('530070000600195000098000060800060003400803001700020006060000280000419005000080079');
    
    // Top-left box (index 0) - rows 0-2, cols 0-2
    const box0 = getBox(grid, 0);
    assertArrayEqual(box0, [5, 3, 0, 6, 0, 0, 0, 9, 8]);
    
    // Center box (index 4) - rows 3-5, cols 3-5
    // Row 3: 800|060|003 -> 060
    // Row 4: 400|803|001 -> 803
    // Row 5: 700|020|006 -> 020
    const box4 = getBox(grid, 4);
    assertArrayEqual(box4, [0, 6, 0, 8, 0, 3, 0, 2, 0]);
    
    // Bottom-right box (index 8) - rows 6-8, cols 6-8
    const box8 = getBox(grid, 8);
    assertArrayEqual(box8, [2, 8, 0, 0, 0, 5, 0, 7, 9]);
  }),

  test('validateGrid - valid incomplete puzzle', () => {
    const grid = parsePuzzleString('530070000600195000098000060800060003400803001700020006060000280000419005000080079');
    const result = validateGrid(grid);
    
    assertEqual(result.status, 'valid-incomplete');
    assertEqual(result.issues.length, 0);
  }),

  test('validateGrid - valid complete puzzle', () => {
    const grid = parsePuzzleString('534678912672195348198342567859761423426853791713924856961537284287419635345286179');
    const result = validateGrid(grid);
    
    assertEqual(result.status, 'valid-complete');
    assertEqual(result.issues.length, 0);
  }),

  test('validateGrid - all empty is valid-incomplete', () => {
    const grid = parsePuzzleString('0'.repeat(81));
    const result = validateGrid(grid);
    
    assertEqual(result.status, 'valid-incomplete');
    assertEqual(result.issues.length, 0);
  }),

  test('validateGrid - invalid with row duplicate', () => {
    // First row has two 5s
    const grid = parsePuzzleString('553070000600195000098000060800060003400803001700020006060000280000419005000080079');
    const result = validateGrid(grid);
    
    assertEqual(result.status, 'invalid');
    assert(result.issues.length > 0, 'Should have at least one issue');
    
    // Check for row duplicate
    const rowIssue = result.issues.find(issue => issue.type === 'row' && issue.index === 0);
    assert(rowIssue !== undefined, 'Should have row 0 issue');
    assertEqual(rowIssue!.value, 5);
  }),

  test('validateGrid - invalid with column duplicate', () => {
    // Column 0 has two 5s (rows 0 and 1)
    const grid = parsePuzzleString('530070000500195000098000060800060003400803001700020006060000280000419005000080079');
    const result = validateGrid(grid);
    
    assertEqual(result.status, 'invalid');
    assert(result.issues.length > 0, 'Should have at least one issue');
    
    // Check for column duplicate
    const colIssue = result.issues.find(issue => issue.type === 'column' && issue.index === 0);
    assert(colIssue !== undefined, 'Should have column 0 issue');
    assertEqual(colIssue!.value, 5);
  }),

  test('validateGrid - invalid with box duplicate', () => {
    // Top-left box (box 0) has two 5s
    // Row 0 cols 0-2: 530
    // Row 1 cols 0-2: 650  <- added 5 here
    // Row 2 cols 0-2: 098
    const grid = parsePuzzleString('530070000650195000098000060800060003400803001700020006060000280000419005000080079');
    const result = validateGrid(grid);
    
    assertEqual(result.status, 'invalid');
    assert(result.issues.length > 0, 'Should have at least one issue');
    
    // Check for box duplicate
    const boxIssue = result.issues.find(issue => issue.type === 'box' && issue.index === 0);
    assert(boxIssue !== undefined, 'Should have box 0 issue');
    assertEqual(boxIssue!.value, 5);
  }),

  test('validateGrid - deterministic issue ordering (rows, cols, boxes)', () => {
    // Create puzzle with issues in all three types
    // Row 0: duplicate 5
    // Column 0: duplicate 6 
    // Box 0: contains duplicate from row
    const grid = parsePuzzleString('553070000600195000098000060800060003400803001700020006060000280000419005000080079');
    const result = validateGrid(grid);
    
    assertEqual(result.status, 'invalid');
    
    // First issue should be row-related (rows checked first)
    assertEqual(result.issues[0].type, 'row');
  }),

  test('validateGrid - multiple issues reported', () => {
    // Row 0: duplicate 5, Column 1: duplicate 3 (positions 1 and 10)
    const grid = parsePuzzleString('553070000630195000098000060800060003400803001700020006060000280000419005000080079');
    const result = validateGrid(grid);
    
    assertEqual(result.status, 'invalid');
    assert(result.issues.length >= 2, 'Should have multiple issues');
  })
];

// Run all tests
(async () => {
  console.log('Running validator tests...\n');
  
  for (const testFn of tests) {
    await testFn();
  }
  
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
