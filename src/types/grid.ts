/**
 * Grid types for Sudoku puzzles
 * 
 * A Grid is a 9x9 2D array where:
 * - 0 represents an empty cell
 * - 1-9 represent filled cells
 */

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Grid = CellValue[][];

/**
 * Helper to convert a Grid to an 81-character string
 * (using '0' for empty cells)
 */
export function gridToString(grid: Grid): string {
  return grid.flat().join('');
}

/**
 * Helper to get a cell value from a grid
 */
export function getCell(grid: Grid, row: number, col: number): CellValue {
  return grid[row][col];
}

/**
 * Helper to set a cell value in a grid (mutates)
 */
export function setCell(grid: Grid, row: number, col: number, value: CellValue): void {
  grid[row][col] = value;
}
