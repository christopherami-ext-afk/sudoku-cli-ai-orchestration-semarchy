/**
 * Grid types for Sudoku puzzles
 *
 * A Grid is a 9x9 2D array where:
 * - 0 represents an empty cell
 * - 1-9 represent filled cells
 */
/**
 * Helper to convert a Grid to an 81-character string
 * (using '0' for empty cells)
 */
export function gridToString(grid) {
    return grid.flat().join('');
}
/**
 * Helper to get a cell value from a grid
 */
export function getCell(grid, row, col) {
    return grid[row][col];
}
/**
 * Helper to set a cell value in a grid (mutates)
 */
export function setCell(grid, row, col, value) {
    grid[row][col] = value;
}
