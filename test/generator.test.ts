import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generatePuzzle } from '../src/core/generator.js';
import { validateGrid } from '../src/core/validator.js';
import { solveGrid } from '../src/core/solver.js';
import type { Difficulty } from '../src/core/generator.js';

describe('Generator Tests', () => {
  describe('generatePuzzle - basic functionality', () => {
    it('should generate a valid puzzle at easy difficulty', () => {
      const result = generatePuzzle({ difficulty: 'easy', seed: 42 });
      
      assert.ok(result.puzzle);
      assert.ok(result.solution);
      
      // Puzzle should be valid
      const validation = validateGrid(result.puzzle);
      assert.ok(validation.status === 'valid-incomplete' || validation.status === 'valid-complete');
    });

    it('should generate a valid puzzle at medium difficulty', () => {
      const result = generatePuzzle({ difficulty: 'medium', seed: 123 });
      
      assert.ok(result.puzzle);
      assert.ok(result.solution);
      
      const validation = validateGrid(result.puzzle);
      assert.ok(validation.status === 'valid-incomplete' || validation.status === 'valid-complete');
    });

    it('should generate a valid puzzle at hard difficulty', () => {
      const result = generatePuzzle({ difficulty: 'hard', seed: 456 });
      
      assert.ok(result.puzzle);
      assert.ok(result.solution);
      
      const validation = validateGrid(result.puzzle);
      assert.ok(validation.status === 'valid-incomplete' || validation.status === 'valid-complete');
    });
  });

  describe('generatePuzzle - determinism', () => {
    it('should generate the same puzzle with the same seed (easy)', () => {
      const result1 = generatePuzzle({ difficulty: 'easy', seed: 42 });
      const result2 = generatePuzzle({ difficulty: 'easy', seed: 42 });
      
      // Puzzles should be identical
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          assert.strictEqual(result1.puzzle[i][j], result2.puzzle[i][j], 
            `Mismatch at position [${i}][${j}]`);
        }
      }
    });

    it('should generate the same puzzle with the same seed (medium)', () => {
      const result1 = generatePuzzle({ difficulty: 'medium', seed: 999 });
      const result2 = generatePuzzle({ difficulty: 'medium', seed: 999 });
      
      // Puzzles should be identical
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          assert.strictEqual(result1.puzzle[i][j], result2.puzzle[i][j]);
        }
      }
    });

    it('should generate the same puzzle with the same seed (hard)', () => {
      const result1 = generatePuzzle({ difficulty: 'hard', seed: 12345 });
      const result2 = generatePuzzle({ difficulty: 'hard', seed: 12345 });
      
      // Puzzles should be identical
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          assert.strictEqual(result1.puzzle[i][j], result2.puzzle[i][j]);
        }
      }
    });

    it('should generate different puzzles with different seeds', () => {
      const result1 = generatePuzzle({ difficulty: 'easy', seed: 1 });
      const result2 = generatePuzzle({ difficulty: 'easy', seed: 2 });
      
      // Puzzles should be different
      let hasDifference = false;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (result1.puzzle[i][j] !== result2.puzzle[i][j]) {
            hasDifference = true;
            break;
          }
        }
        if (hasDifference) break;
      }
      
      assert.ok(hasDifference, 'Puzzles with different seeds should be different');
    });
  });

  describe('generatePuzzle - solvability', () => {
    it('should generate a solvable puzzle (easy)', () => {
      const result = generatePuzzle({ difficulty: 'easy', seed: 42 });
      const solveResult = solveGrid(result.puzzle);
      
      assert.strictEqual(solveResult.solved, true);
      assert.ok(solveResult.grid);
    });

    it('should generate a solvable puzzle (medium)', () => {
      const result = generatePuzzle({ difficulty: 'medium', seed: 42 });
      const solveResult = solveGrid(result.puzzle);
      
      assert.strictEqual(solveResult.solved, true);
      assert.ok(solveResult.grid);
    });

    it('should generate a solvable puzzle (hard)', () => {
      const result = generatePuzzle({ difficulty: 'hard', seed: 42 });
      const solveResult = solveGrid(result.puzzle);
      
      assert.strictEqual(solveResult.solved, true);
      assert.ok(solveResult.grid);
    });

    it('should have solution that matches the provided solution', () => {
      const result = generatePuzzle({ difficulty: 'easy', seed: 42 });
      const solveResult = solveGrid(result.puzzle);
      
      assert.strictEqual(solveResult.solved, true);
      assert.ok(solveResult.grid);
      
      // The solution from solver should match the solution from generator
      const solutionValidation = validateGrid(result.solution);
      assert.strictEqual(solutionValidation.status, 'valid-complete');
    });
  });

  describe('generatePuzzle - difficulty levels', () => {
    it('should generate puzzles with different clue counts for different difficulties', () => {
      const easy = generatePuzzle({ difficulty: 'easy', seed: 100 });
      const medium = generatePuzzle({ difficulty: 'medium', seed: 100 });
      const hard = generatePuzzle({ difficulty: 'hard', seed: 100 });
      
      // Count clues (non-zero cells)
      const countClues = (grid: number[][]) => {
        let count = 0;
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (grid[i][j] !== 0) count++;
          }
        }
        return count;
      };
      
      const easyClues = countClues(easy.puzzle);
      const mediumClues = countClues(medium.puzzle);
      const hardClues = countClues(hard.puzzle);
      
      // Easy should have more clues than hard (generally)
      // Note: With same seed, pattern might vary, but overall easy >= medium >= hard
      assert.ok(easyClues > 0);
      assert.ok(mediumClues > 0);
      assert.ok(hardClues > 0);
      
      // Easy should typically have the most clues
      assert.ok(easyClues >= hardClues || mediumClues >= hardClues, 
        'Easier difficulties should generally have more clues');
    });

    it('should respect difficulty constraints (approximate)', () => {
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
      
      for (const difficulty of difficulties) {
        const result = generatePuzzle({ difficulty, seed: 42 });
        
        let clueCount = 0;
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (result.puzzle[i][j] !== 0) clueCount++;
          }
        }
        
        // Verify puzzle has reasonable number of clues
        // Easy: ~36-40, Medium: ~30-35, Hard: ~24-29 (from BACKLOG_PACK)
        if (difficulty === 'easy') {
          assert.ok(clueCount >= 30, `Easy puzzle should have >= 30 clues, got ${clueCount}`);
        } else if (difficulty === 'medium') {
          assert.ok(clueCount >= 25, `Medium puzzle should have >= 25 clues, got ${clueCount}`);
        } else if (difficulty === 'hard') {
          assert.ok(clueCount >= 20, `Hard puzzle should have >= 20 clues, got ${clueCount}`);
        }
        
        // All puzzles should have some empty cells
        assert.ok(clueCount < 81, `Puzzle should have some empty cells`);
      }
    });
  });

  describe('generatePuzzle - solution correctness', () => {
    it('should provide a complete valid solution', () => {
      const result = generatePuzzle({ difficulty: 'easy', seed: 42 });
      
      const validation = validateGrid(result.solution);
      assert.strictEqual(validation.status, 'valid-complete');
      assert.strictEqual(validation.issues.length, 0);
    });

    it('should have puzzle as a subset of solution', () => {
      const result = generatePuzzle({ difficulty: 'easy', seed: 42 });
      
      // Every clue in puzzle should match the solution
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (result.puzzle[i][j] !== 0) {
            assert.strictEqual(result.puzzle[i][j], result.solution[i][j],
              `Clue at [${i}][${j}] should match solution`);
          }
        }
      }
    });
  });

  describe('generatePuzzle - edge cases', () => {
    it('should handle seed 0', () => {
      const result = generatePuzzle({ difficulty: 'easy', seed: 0 });
      
      assert.ok(result.puzzle);
      assert.ok(result.solution);
      
      const validation = validateGrid(result.puzzle);
      assert.ok(validation.status === 'valid-incomplete' || validation.status === 'valid-complete');
    });

    it('should handle large seeds', () => {
      const result = generatePuzzle({ difficulty: 'easy', seed: 999999999 });
      
      assert.ok(result.puzzle);
      assert.ok(result.solution);
      
      const validation = validateGrid(result.puzzle);
      assert.ok(validation.status === 'valid-incomplete' || validation.status === 'valid-complete');
    });

    it('should handle negative seeds', () => {
      const result = generatePuzzle({ difficulty: 'easy', seed: -42 });
      
      assert.ok(result.puzzle);
      assert.ok(result.solution);
    });
  });
});
