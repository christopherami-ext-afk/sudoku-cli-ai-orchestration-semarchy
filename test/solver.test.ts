import { describe, it } from 'node:test';
import assert from 'node:assert';
import { solveGrid } from '../src/core/solver.js';
import { parsePuzzleString } from '../src/core/parser.js';
import { validateGrid } from '../src/core/validator.js';

describe('Solver Tests', () => {
  describe('solveGrid - solvable puzzles', () => {
    it('should solve a known easy puzzle', () => {
      const puzzleStr = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const grid = parsePuzzleString(puzzleStr);
      const result = solveGrid(grid);
      
      assert.strictEqual(result.solved, true);
      assert.ok(result.grid);
      
      // Verify solution is valid and complete
      const validation = validateGrid(result.grid);
      assert.strictEqual(validation.status, 'valid-complete');
    });

    it('should solve a puzzle with many empty cells', () => {
      const puzzleStr = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';
      const grid = parsePuzzleString(puzzleStr);
      const result = solveGrid(grid);
      
      assert.strictEqual(result.solved, true);
      assert.ok(result.grid);
      
      // Verify solution is valid
      const validation = validateGrid(result.grid);
      assert.strictEqual(validation.status, 'valid-complete');
    });

    it('should return the same puzzle if already complete', () => {
      const puzzleStr = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
      const grid = parsePuzzleString(puzzleStr);
      const result = solveGrid(grid);
      
      assert.strictEqual(result.solved, true);
      assert.ok(result.grid);
      
      // Should match the input (already solved)
      const validation = validateGrid(result.grid);
      assert.strictEqual(validation.status, 'valid-complete');
    });

    it('should preserve original clues in solution', () => {
      const puzzleStr = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const grid = parsePuzzleString(puzzleStr);
      const result = solveGrid(grid);
      
      assert.strictEqual(result.solved, true);
      assert.ok(result.grid);
      
      // Check that original clues are preserved
      assert.strictEqual(result.grid[0][0], 5); // original clue
      assert.strictEqual(result.grid[0][1], 3); // original clue
      assert.strictEqual(result.grid[1][0], 6); // original clue
    });
  });

  describe('solveGrid - unsolvable puzzles', () => {
    it('should detect an unsolvable puzzle', () => {
      // All cells in first row are the same digit - impossible
      const puzzleStr = '555555555666666666777777777888888888999999999111111111222222222333333333444444444';
      const grid = parsePuzzleString(puzzleStr);
      const result = solveGrid(grid);
      
      assert.strictEqual(result.solved, false);
      assert.ok(result.reason);
      assert.ok(result.reason.includes('unsolvable') || result.reason.includes('invalid'));
    });

    it('should detect a puzzle with contradictory clues', () => {
      // Two identical rows - unsolvable
      const puzzleStr = 
        '123456789' +
        '123456789' +
        '0'.repeat(63);
      const grid = parsePuzzleString(puzzleStr);
      const result = solveGrid(grid);
      
      assert.strictEqual(result.solved, false);
      assert.ok(result.reason);
    });
  });

  describe('solveGrid - determinism', () => {
    it('should produce the same solution for the same puzzle', () => {
      const puzzleStr = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const grid = parsePuzzleString(puzzleStr);
      
      const result1 = solveGrid(grid);
      const result2 = solveGrid(parsePuzzleString(puzzleStr));
      
      assert.strictEqual(result1.solved, true);
      assert.strictEqual(result2.solved, true);
      assert.ok(result1.grid);
      assert.ok(result2.grid);
      
      // Solutions should be identical
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          assert.strictEqual(result1.grid[i][j], result2.grid[i][j]);
        }
      }
    });
  });

  describe('solveGrid - edge cases', () => {
    it('should handle an empty puzzle', () => {
      const puzzleStr = '0'.repeat(81);
      const grid = parsePuzzleString(puzzleStr);
      const result = solveGrid(grid);
      
      // Empty puzzle should be solvable (has multiple solutions, but solver should find one)
      assert.strictEqual(result.solved, true);
      assert.ok(result.grid);
      
      const validation = validateGrid(result.grid);
      assert.strictEqual(validation.status, 'valid-complete');
    });

    it('should handle a puzzle with only one empty cell', () => {
      // Complete puzzle except last cell
      const puzzleStr = '534678912672195348198342567859761423426853791713924856961537284287419635345286170';
      const grid = parsePuzzleString(puzzleStr);
      const result = solveGrid(grid);
      
      assert.strictEqual(result.solved, true);
      assert.ok(result.grid);
      assert.strictEqual(result.grid[8][8], 9); // The missing cell should be 9
      
      const validation = validateGrid(result.grid);
      assert.strictEqual(validation.status, 'valid-complete');
    });
  });

  describe('solveGrid - validation integration', () => {
    it('should refuse to solve an invalid puzzle', () => {
      // Duplicate in first row
      const puzzleStr = '530070000600195000098000060800060003400803001700020006060000280000419005000080077';
      const grid = parsePuzzleString(puzzleStr);
      
      // First check if it's invalid
      const validation = validateGrid(grid);
      assert.strictEqual(validation.status, 'invalid');
      
      // Solver should handle invalid input
      const result = solveGrid(grid);
      assert.strictEqual(result.solved, false);
    });
  });
});
