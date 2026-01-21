import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateGrid } from '../src/core/validator.js';
import { parsePuzzleString } from '../src/core/parser.js';

describe('Validator Tests', () => {
  describe('validateGrid - valid puzzles', () => {
    it('should validate a valid incomplete puzzle', () => {
      const puzzleStr = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'valid-incomplete');
      assert.strictEqual(result.issues.length, 0);
    });

    it('should validate a valid complete puzzle', () => {
      const puzzleStr = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'valid-complete');
      assert.strictEqual(result.issues.length, 0);
    });

    it('should validate an all-empty puzzle as valid-incomplete', () => {
      const puzzleStr = '0'.repeat(81);
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'valid-incomplete');
      assert.strictEqual(result.issues.length, 0);
    });
  });

  describe('validateGrid - invalid puzzles (row conflicts)', () => {
    it('should detect duplicate in a row', () => {
      // Two 7s in the last row
      const puzzleStr = '530070000600195000098000060800060003400803001700020006060000280000419005000080077';
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'invalid');
      assert.ok(result.issues.length > 0);
      assert.ok(result.issues.some(issue => issue.type === 'row'));
    });

    it('should detect multiple duplicates in a row', () => {
      const puzzleStr = '111000000' + '0'.repeat(72);
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'invalid');
      const rowIssues = result.issues.filter(issue => issue.type === 'row');
      assert.ok(rowIssues.length > 0);
    });
  });

  describe('validateGrid - invalid puzzles (column conflicts)', () => {
    it('should detect duplicate in a column', () => {
      // Two 5s in first column
      const puzzleStr = 
        '500000000' +
        '500000000' +
        '0'.repeat(63);
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'invalid');
      assert.ok(result.issues.some(issue => issue.type === 'column'));
    });
  });

  describe('validateGrid - invalid puzzles (box conflicts)', () => {
    it('should detect duplicate in a 3x3 box', () => {
      // Two 1s in the top-left box
      const puzzleStr = 
        '110000000' +
        '100000000' +
        '0'.repeat(63);
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'invalid');
      assert.ok(result.issues.some(issue => issue.type === 'box'));
    });

    it('should detect conflicts in different boxes', () => {
      // Conflicts in multiple boxes
      const puzzleStr = 
        '110000111' +  // box 0 and box 2
        '100000100' +
        '000000000' +
        '0'.repeat(54);
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'invalid');
      const boxIssues = result.issues.filter(issue => issue.type === 'box');
      assert.ok(boxIssues.length >= 2); // At least 2 box conflicts
    });
  });

  describe('validateGrid - mixed conflicts', () => {
    it('should detect multiple types of conflicts', () => {
      // Create a puzzle with row, column, and box conflicts
      const puzzleStr = 
        '115000000' +  // row conflict (two 1s) and box conflict
        '115000000' +  // column conflict (two 1s in first two cols)
        '0'.repeat(63);
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'invalid');
      assert.ok(result.issues.length > 0);
      
      // Should have at least one type of issue
      const hasRowIssue = result.issues.some(issue => issue.type === 'row');
      const hasColIssue = result.issues.some(issue => issue.type === 'column');
      const hasBoxIssue = result.issues.some(issue => issue.type === 'box');
      
      assert.ok(hasRowIssue || hasColIssue || hasBoxIssue);
    });
  });

  describe('validateGrid - edge cases', () => {
    it('should ignore empty cells when checking for duplicates', () => {
      const puzzleStr = '100000000' + '0'.repeat(72);
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      // Should be valid because empty cells (0s) don't count as duplicates
      assert.strictEqual(result.status, 'valid-incomplete');
      assert.strictEqual(result.issues.length, 0);
    });

    it('should handle puzzle with all 9s in different positions', () => {
      // Each 9 in a different row, column, and box
      const puzzleStr = 
        '900000000' +
        '090000000' +
        '009000000' +
        '000900000' +
        '000090000' +
        '000009000' +
        '000000900' +
        '000000090' +
        '000000009';
      const grid = parsePuzzleString(puzzleStr);
      const result = validateGrid(grid);
      
      assert.strictEqual(result.status, 'valid-incomplete');
      assert.strictEqual(result.issues.length, 0);
    });
  });
});
