/**
 * SUD-5: Sudoku Generator with Difficulty Levels
 * 
 * Generates valid, solvable Sudoku puzzles with deterministic seeding
 */

import { Grid, CellValue, GRID_SIZE } from '../types/grid.js';
import { createPrng, PRNG } from './prng.js';
import { solveGrid, countSolutions } from './solver.js';
import { validateGrid } from './validator.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GenerateOptions {
  difficulty: Difficulty;
  seed: number;
}

export interface GenerateResult {
  puzzle: Grid;
  solution: Grid;
}

/**
 * Difficulty parameters
 * 
 * These control the number of clues (filled cells) in the generated puzzle:
 * - easy: 36-40 clues (easier to solve, more hints)
 * - medium: 30-35 clues (moderate difficulty)
 * - hard: 24-29 clues (harder to solve, fewer hints)
 * 
 * Note: These are approximate ranges. The actual difficulty also depends
 * on the structure of the puzzle and which cells are removed.
 */
const DIFFICULTY_PARAMS: Record<Difficulty, { minClues: number; maxClues: number }> = {
  easy: { minClues: 36, maxClues: 40 },
  medium: { minClues: 30, maxClues: 35 },
  hard: { minClues: 24, maxClues: 29 }
};

/**
 * Create a solved Sudoku grid using deterministic shuffling
 * 
 * Strategy:
 * 1. Start with a known valid solution pattern
 * 2. Apply deterministic transformations (shuffle rows/cols within boxes)
 * 3. Result is a valid, solved grid
 * 
 * @param prng - Deterministic PRNG
 * @returns A valid, complete Sudoku grid
 */
function createSolvedGrid(prng: PRNG): Grid {
  // Start with a base pattern (a valid solved Sudoku)
  const base: Grid = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 4, 5, 6, 7, 8, 9, 1],
    [5, 6, 7, 8, 9, 1, 2, 3, 4],
    [8, 9, 1, 2, 3, 4, 5, 6, 7],
    [3, 4, 5, 6, 7, 8, 9, 1, 2],
    [6, 7, 8, 9, 1, 2, 3, 4, 5],
    [9, 1, 2, 3, 4, 5, 6, 7, 8]
  ];
  
  // Create a working copy
  const grid: Grid = base.map(row => [...row]);
  
  // Apply random transformations that preserve validity
  
  // 1. Shuffle rows within each box (3 boxes vertically)
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    const rows = [0, 1, 2];
    prng.shuffle(rows);
    
    const startRow = boxRow * 3;
    const tempRows = [
      [...grid[startRow + 0]],
      [...grid[startRow + 1]],
      [...grid[startRow + 2]]
    ];
    
    for (let i = 0; i < 3; i++) {
      grid[startRow + i] = tempRows[rows[i]];
    }
  }
  
  // 2. Shuffle columns within each box (3 boxes horizontally)
  for (let boxCol = 0; boxCol < 3; boxCol++) {
    const cols = [0, 1, 2];
    prng.shuffle(cols);
    
    const startCol = boxCol * 3;
    
    for (let row = 0; row < GRID_SIZE; row++) {
      const tempCells = [
        grid[row][startCol + 0],
        grid[row][startCol + 1],
        grid[row][startCol + 2]
      ];
      
      for (let i = 0; i < 3; i++) {
        grid[row][startCol + i] = tempCells[cols[i]];
      }
    }
  }
  
  // 3. Shuffle box rows (swap entire 3-row groups)
  const boxRows = [0, 1, 2];
  prng.shuffle(boxRows);
  
  const tempBoxes: Grid = [];
  for (let i = 0; i < 3; i++) {
    const boxRow = boxRows[i];
    for (let r = 0; r < 3; r++) {
      tempBoxes.push([...grid[boxRow * 3 + r]]);
    }
  }
  
  for (let i = 0; i < GRID_SIZE; i++) {
    grid[i] = tempBoxes[i];
  }
  
  // 4. Shuffle box columns (swap entire 3-column groups)
  const boxCols = [0, 1, 2];
  prng.shuffle(boxCols);
  
  for (let row = 0; row < GRID_SIZE; row++) {
    const tempRow: CellValue[] = [];
    for (let i = 0; i < 3; i++) {
      const boxCol = boxCols[i];
      for (let c = 0; c < 3; c++) {
        tempRow.push(grid[row][boxCol * 3 + c]);
      }
    }
    grid[row] = tempRow;
  }
  
  return grid;
}

/**
 * Remove clues from a solved grid to create a puzzle
 * 
 * Strategy:
 * 1. Start with a complete solution
 * 2. Remove cells randomly until we reach the target clue count
 * 3. Ensure the puzzle still has a unique solution
 * 
 * @param solution - A valid, complete Sudoku grid
 * @param targetClues - Number of clues to leave in the puzzle
 * @param prng - Deterministic PRNG
 * @returns Grid with some cells removed (set to 0)
 */
function removeClues(solution: Grid, targetClues: number, prng: PRNG): Grid {
  // Create a working copy
  const puzzle: Grid = solution.map(row => [...row]);
  
  // Create list of all cell positions
  const positions: [number, number][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      positions.push([row, col]);
    }
  }
  
  // Shuffle positions for random removal
  prng.shuffle(positions);
  
  // Calculate how many cells to remove
  const totalCells = GRID_SIZE * GRID_SIZE;
  const cellsToRemove = totalCells - targetClues;
  
  // Remove cells one by one
  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= cellsToRemove) break;
    
    // Save the value in case we need to restore it
    const savedValue = puzzle[row][col];
    
    // Try removing this cell
    puzzle[row][col] = 0;
    
    // Check if puzzle still has a unique solution
    // For performance, we only check for <= 2 solutions
    const solutions = countSolutions(puzzle, 2);
    
    if (solutions === 1) {
      // Good, still unique solution
      removed++;
    } else {
      // Restore the cell (removing it made puzzle unsolvable or non-unique)
      puzzle[row][col] = savedValue;
    }
  }
  
  return puzzle;
}

/**
 * Generate a Sudoku puzzle
 * 
 * @param options - Generation options (difficulty and seed)
 * @returns GenerateResult with puzzle and solution
 */
export function generatePuzzle(options: GenerateOptions): GenerateResult {
  const { difficulty, seed } = options;
  
  // Validate difficulty
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error(`Invalid difficulty: ${difficulty}. Must be 'easy', 'medium', or 'hard'`);
  }
  
  // Create deterministic PRNG
  const prng = createPrng(seed);
  
  // Get difficulty parameters
  const params = DIFFICULTY_PARAMS[difficulty];
  const targetClues = prng.nextInt(params.minClues, params.maxClues);
  
  // Generate a solved grid
  const solution = createSolvedGrid(prng);
  
  // Verify the solution is valid and complete
  const validation = validateGrid(solution);
  if (validation.status !== 'valid-complete') {
    throw new Error('Failed to generate valid solution');
  }
  
  // Remove clues to create the puzzle
  const puzzle = removeClues(solution, targetClues, prng);
  
  // Verify the puzzle is valid
  const puzzleValidation = validateGrid(puzzle);
  if (puzzleValidation.status === 'invalid') {
    throw new Error('Generated puzzle is invalid');
  }
  
  // Verify the puzzle is solvable
  const solveResult = solveGrid(puzzle);
  if (!solveResult.solved) {
    throw new Error('Generated puzzle is not solvable');
  }
  
  return {
    puzzle,
    solution
  };
}
