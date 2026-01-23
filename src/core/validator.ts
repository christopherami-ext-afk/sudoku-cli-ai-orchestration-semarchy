import type { Grid, CellValue } from '../types/grid.js';

/**
 * Validation status for a Sudoku grid
 */
export type ValidationStatus = 'valid-complete' | 'valid-incomplete' | 'invalid';

/**
 * Describes a validation issue found in the grid
 */
export interface ValidationIssue {
  type: 'row' | 'column' | 'box';
  index: number; // 0-based
  value: number;  // The duplicate value (1-9)
}

/**
 * Result of validating a Sudoku grid
 */
export interface ValidationResult {
  status: ValidationStatus;
  issues: ValidationIssue[];
}

/**
 * Get all values in a specific row
 */
export function getRow(grid: Grid, rowIndex: number): CellValue[] {
  return grid[rowIndex];
}

/**
 * Get all values in a specific column
 */
export function getColumn(grid: Grid, colIndex: number): CellValue[] {
  const column: CellValue[] = [];
  for (let row = 0; row < 9; row++) {
    column.push(grid[row][colIndex]);
  }
  return column;
}

/**
 * Get all values in a specific 3x3 box
 * @param boxIndex 0-8, where boxes are numbered left-to-right, top-to-bottom
 */
export function getBox(grid: Grid, boxIndex: number): CellValue[] {
  const boxRow = Math.floor(boxIndex / 3);
  const boxCol = boxIndex % 3;
  const startRow = boxRow * 3;
  const startCol = boxCol * 3;
  
  const box: CellValue[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      box.push(grid[startRow + r][startCol + c]);
    }
  }
  return box;
}

/**
 * Find duplicate values in a unit (row/column/box)
 * Returns array of duplicate values found
 */
function findDuplicates(cells: CellValue[]): number[] {
  const counts = new Map<number, number>();
  const duplicates: number[] = [];
  
  for (const cell of cells) {
    // Skip empty cells
    if (cell === 0) continue;
    
    const count = counts.get(cell) || 0;
    counts.set(cell, count + 1);
    
    // Record duplicate on first duplicate occurrence
    if (count === 1 && !duplicates.includes(cell)) {
      duplicates.push(cell);
    }
  }
  
  return duplicates.sort((a, b) => a - b); // Deterministic ordering
}

/**
 * Validate a Sudoku grid
 * 
 * Checks for:
 * - No duplicate digits (1-9) in any row, column, or 3x3 box
 * - Empty cells (0) are ignored when checking for duplicates
 * 
 * @param grid - 9x9 Sudoku grid to validate
 * @returns ValidationResult with status and any issues found
 */
export function validateGrid(grid: Grid): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check all rows (deterministic order: rows first)
  for (let rowIndex = 0; rowIndex < 9; rowIndex++) {
    const row = getRow(grid, rowIndex);
    const duplicates = findDuplicates(row);
    
    for (const value of duplicates) {
      issues.push({
        type: 'row',
        index: rowIndex,
        value
      });
    }
  }
  
  // Check all columns (deterministic order: columns second)
  for (let colIndex = 0; colIndex < 9; colIndex++) {
    const column = getColumn(grid, colIndex);
    const duplicates = findDuplicates(column);
    
    for (const value of duplicates) {
      issues.push({
        type: 'column',
        index: colIndex,
        value
      });
    }
  }
  
  // Check all boxes (deterministic order: boxes last)
  for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
    const box = getBox(grid, boxIndex);
    const duplicates = findDuplicates(box);
    
    for (const value of duplicates) {
      issues.push({
        type: 'box',
        index: boxIndex,
        value
      });
    }
  }
  
  // Determine status
  if (issues.length > 0) {
    return {
      status: 'invalid',
      issues
    };
  }
  
  // Check if complete (no empty cells)
  const hasEmpty = grid.some(row => row.some(cell => cell === 0));
  
  return {
    status: hasEmpty ? 'valid-incomplete' : 'valid-complete',
    issues: []
  };
}
