/**
 * SUD-3: Sudoku Validator
 * 
 * Validates Sudoku grids for rule consistency (rows, columns, boxes)
 */

import { Grid, CellValue, GRID_SIZE, BOX_SIZE } from '../types/grid.js';

export type ValidationStatus = 'valid-complete' | 'valid-incomplete' | 'invalid';

export interface ValidationIssue {
  type: 'row' | 'column' | 'box';
  index: number; // 0-based
  value: number;
}

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
  for (let row = 0; row < GRID_SIZE; row++) {
    column.push(grid[row][colIndex]);
  }
  return column;
}

/**
 * Get all values in a specific 3x3 box
 * 
 * @param grid - The Sudoku grid
 * @param boxIndex - Box index 0-8 (row-major order)
 */
export function getBox(grid: Grid, boxIndex: number): CellValue[] {
  const boxRow = Math.floor(boxIndex / BOX_SIZE);
  const boxCol = boxIndex % BOX_SIZE;
  
  const box: CellValue[] = [];
  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      const row = boxRow * BOX_SIZE + r;
      const col = boxCol * BOX_SIZE + c;
      box.push(grid[row][col]);
    }
  }
  return box;
}

/**
 * Get box index for a given cell position
 */
export function getBoxIndex(row: number, col: number): number {
  const boxRow = Math.floor(row / BOX_SIZE);
  const boxCol = Math.floor(col / BOX_SIZE);
  return boxRow * BOX_SIZE + boxCol;
}

/**
 * Check a unit (row/column/box) for duplicates
 * 
 * @param values - Array of cell values
 * @returns Array of duplicate values (non-zero only)
 */
function findDuplicates(values: CellValue[]): number[] {
  const counts = new Map<number, number>();
  const duplicates: number[] = [];
  
  for (const value of values) {
    // Ignore empty cells (0)
    if (value === 0) continue;
    
    const count = counts.get(value) || 0;
    counts.set(value, count + 1);
    
    if (count === 1) {
      // First duplicate found
      duplicates.push(value);
    }
  }
  
  return duplicates;
}

/**
 * Validate a Sudoku grid
 * 
 * Checks for rule violations (duplicates in rows, columns, boxes) and completeness
 * 
 * @param grid - 9x9 Sudoku grid
 * @returns ValidationResult with status and any issues found
 */
export function validateGrid(grid: Grid): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check all rows
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowValues = getRow(grid, row);
    const duplicates = findDuplicates(rowValues);
    
    for (const value of duplicates) {
      issues.push({
        type: 'row',
        index: row,
        value
      });
    }
  }
  
  // Check all columns
  for (let col = 0; col < GRID_SIZE; col++) {
    const colValues = getColumn(grid, col);
    const duplicates = findDuplicates(colValues);
    
    for (const value of duplicates) {
      issues.push({
        type: 'column',
        index: col,
        value
      });
    }
  }
  
  // Check all boxes
  for (let box = 0; box < GRID_SIZE; box++) {
    const boxValues = getBox(grid, box);
    const duplicates = findDuplicates(boxValues);
    
    for (const value of duplicates) {
      issues.push({
        type: 'box',
        index: box,
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
  let hasEmpty = false;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        hasEmpty = true;
        break;
      }
    }
    if (hasEmpty) break;
  }
  
  return {
    status: hasEmpty ? 'valid-incomplete' : 'valid-complete',
    issues: []
  };
}

/**
 * Check if a value can be placed at a specific position
 * 
 * Used by solver to check constraints
 * 
 * @param grid - The Sudoku grid
 * @param row - Row index (0-8)
 * @param col - Column index (0-8)
 * @param value - Value to check (1-9)
 * @returns true if the value can be placed at the position
 */
export function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  value: CellValue
): boolean {
  if (value === 0) return true; // Empty is always valid
  
  // Check row
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && grid[row][c] === value) {
      return false;
    }
  }
  
  // Check column
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && grid[r][col] === value) {
      return false;
    }
  }
  
  // Check box
  const boxRow = Math.floor(row / BOX_SIZE);
  const boxCol = Math.floor(col / BOX_SIZE);
  
  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      const cellRow = boxRow * BOX_SIZE + r;
      const cellCol = boxCol * BOX_SIZE + c;
      
      // Skip the cell itself
      if (cellRow === row && cellCol === col) continue;
      
      // Check if this cell in the box has the same value
      if (grid[cellRow][cellCol] === value) {
        return false;
      }
    }
  }
  
  return true;
}
