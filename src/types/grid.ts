/**
 * Core Sudoku grid types
 * 
 * A Sudoku grid is a 9x9 matrix where:
 * - 0 represents an empty cell
 * - 1-9 represent filled cells
 */

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Grid = CellValue[][];

/**
 * Constants for Sudoku grids
 */
export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const TOTAL_CELLS = 81;
