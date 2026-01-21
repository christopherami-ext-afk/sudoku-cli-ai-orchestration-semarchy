/**
 * SUD-4: Sudoku Solver
 * 
 * Implements a deterministic backtracking solver for Sudoku puzzles
 */

import { Grid, CellValue, GRID_SIZE } from '../types/grid.js';
import { isValidPlacement } from './validator.js';

export interface SolveResult {
  solved: boolean;
  grid?: Grid;
  reason?: string;
}

/**
 * Create a deep copy of a grid
 */
function copyGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

/**
 * Find the next empty cell in the grid
 * 
 * @param grid - The Sudoku grid
 * @returns [row, col] of next empty cell, or null if grid is full
 */
function findEmptyCell(grid: Grid): [number, number] | null {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

/**
 * Solve a Sudoku puzzle using deterministic backtracking
 * 
 * The algorithm:
 * 1. Find the next empty cell (scanning left-to-right, top-to-bottom)
 * 2. Try values 1-9 in order
 * 3. For each valid value, recursively solve the rest
 * 4. If a solution is found, return it
 * 5. If no solution is found, backtrack
 * 
 * This is deterministic because:
 * - Cells are always checked in the same order
 * - Values are always tried 1-9 in ascending order
 * 
 * @param grid - The Sudoku grid to solve
 * @returns SolveResult with solution or failure reason
 */
export function solveGrid(grid: Grid): SolveResult {
  // Create a working copy to avoid modifying the input
  const workingGrid = copyGrid(grid);
  
  // Try to solve
  const solved = solveRecursive(workingGrid);
  
  if (solved) {
    return {
      solved: true,
      grid: workingGrid
    };
  } else {
    return {
      solved: false,
      reason: 'unsolvable'
    };
  }
}

/**
 * Recursive backtracking solver
 * 
 * @param grid - The grid to solve (modified in place)
 * @returns true if solved, false if unsolvable
 */
function solveRecursive(grid: Grid): boolean {
  // Find next empty cell
  const emptyCell = findEmptyCell(grid);
  
  // If no empty cells, puzzle is solved
  if (emptyCell === null) {
    return true;
  }
  
  const [row, col] = emptyCell;
  
  // Try values 1-9 in order (deterministic)
  for (let value = 1; value <= 9; value++) {
    const cellValue = value as CellValue;
    
    // Check if this value is valid
    if (isValidPlacement(grid, row, col, cellValue)) {
      // Place the value
      grid[row][col] = cellValue;
      
      // Recursively solve the rest
      if (solveRecursive(grid)) {
        return true; // Solution found
      }
      
      // Backtrack: this value didn't lead to a solution
      grid[row][col] = 0;
    }
  }
  
  // No valid value found for this cell
  return false;
}

/**
 * Count the number of solutions for a puzzle
 * 
 * Used by the generator to ensure puzzles have unique solutions
 * 
 * @param grid - The Sudoku grid
 * @param maxCount - Stop counting after this many solutions (for efficiency)
 * @returns Number of solutions found (up to maxCount)
 */
export function countSolutions(grid: Grid, maxCount = 2): number {
  const workingGrid = copyGrid(grid);
  return countSolutionsRecursive(workingGrid, maxCount);
}

/**
 * Recursive solution counter
 */
function countSolutionsRecursive(grid: Grid, maxCount: number): number {
  // Find next empty cell
  const emptyCell = findEmptyCell(grid);
  
  // If no empty cells, we found a solution
  if (emptyCell === null) {
    return 1;
  }
  
  const [row, col] = emptyCell;
  let count = 0;
  
  // Try values 1-9
  for (let value = 1; value <= 9; value++) {
    const cellValue = value as CellValue;
    
    if (isValidPlacement(grid, row, col, cellValue)) {
      grid[row][col] = cellValue;
      
      count += countSolutionsRecursive(grid, maxCount);
      
      // Early exit if we've found enough solutions
      if (count >= maxCount) {
        grid[row][col] = 0;
        return count;
      }
      
      grid[row][col] = 0;
    }
  }
  
  return count;
}
