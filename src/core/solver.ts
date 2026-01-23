import type { Grid, CellValue } from '../types/grid.js';
import { validateGrid } from './validator.js';

export interface SolveResult {
  solved: boolean;
  grid?: Grid;
  reason?: string; // "unsolvable" | "invalid" | ...
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice()) as Grid;
}

function isValidPlacement(grid: Grid, row: number, col: number, value: CellValue): boolean {
  // Row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === value) return false;
  }

  // Column
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === value) return false;
  }

  // Box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[boxRow + r][boxCol + c] === value) return false;
    }
  }

  return true;
}

function findNextEmpty(grid: Grid): { row: number; col: number } | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        return { row, col };
      }
    }
  }
  return null;
}

function solveBacktracking(grid: Grid): boolean {
  const next = findNextEmpty(grid);
  if (!next) {
    return true;
  }

  const { row, col } = next;

  for (let candidate = 1 as CellValue; candidate <= 9; candidate = (candidate + 1) as CellValue) {
    if (!isValidPlacement(grid, row, col, candidate)) continue;

    grid[row][col] = candidate;
    if (solveBacktracking(grid)) {
      return true;
    }
    grid[row][col] = 0;
  }

  return false;
}

/**
 * Deterministic Sudoku solver.
 * - Validates the starting grid.
 * - Solves using fixed-order backtracking (top-left to bottom-right, digits 1..9).
 */
export function solveGrid(inputGrid: Grid): SolveResult {
  const validation = validateGrid(inputGrid);
  if (validation.status === 'invalid') {
    return { solved: false, reason: 'invalid' };
  }

  const working = cloneGrid(inputGrid);
  const solved = solveBacktracking(working);
  if (!solved) {
    return { solved: false, reason: 'unsolvable' };
  }

  // Safety check: solved grid should validate and be complete
  const solvedValidation = validateGrid(working);
  if (solvedValidation.status !== 'valid-complete') {
    return { solved: false, reason: 'unsolvable' };
  }

  return { solved: true, grid: working };
}
