/**
 * SUD-2: Robust Sudoku Input Parsing
 * 
 * Handles parsing of Sudoku puzzles from 81-char strings or files
 */

import { readFile, access } from 'fs/promises';
import { Grid, CellValue, TOTAL_CELLS, GRID_SIZE } from '../types/grid.js';

/**
 * Custom error class for parsing errors
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Parse a puzzle string into a Grid
 * 
 * @param input - 81-character string containing digits 1-9, 0, or .
 * @returns Grid - 9x9 array of CellValue
 * @throws ParseError if input is invalid
 */
export function parsePuzzleString(input: string): Grid {
  // Validate length
  if (input.length !== TOTAL_CELLS) {
    throw new ParseError(
      `Invalid puzzle length: expected ${TOTAL_CELLS} characters, got ${input.length}`,
      'INVALID_LENGTH'
    );
  }

  // Validate characters
  const validChars = /^[0-9.]+$/;
  if (!validChars.test(input)) {
    const invalidChar = input.match(/[^0-9.]/)?.[0];
    throw new ParseError(
      `Invalid character in puzzle: '${invalidChar}'. Only digits 1-9, 0, and . are allowed`,
      'INVALID_CHARACTER'
    );
  }

  // Convert to Grid
  const grid: Grid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const gridRow: CellValue[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const index = row * GRID_SIZE + col;
      const char = input[index];
      
      // Normalize empties: both '0' and '.' become 0
      let value: CellValue;
      if (char === '.' || char === '0') {
        value = 0;
      } else {
        value = parseInt(char, 10) as CellValue;
      }
      
      gridRow.push(value);
    }
    grid.push(gridRow);
  }

  return grid;
}

/**
 * Load puzzle string from a file
 * 
 * @param path - Path to file containing puzzle
 * @returns Promise<string> - The puzzle string
 * @throws ParseError if file cannot be read or is invalid
 */
export async function loadPuzzleFromFile(path: string): Promise<string> {
  try {
    // Check if file exists and is readable
    await access(path);
  } catch (error) {
    throw new ParseError(
      `File not found or not readable: ${path}`,
      'FILE_NOT_FOUND'
    );
  }

  let content: string;
  try {
    content = await readFile(path, 'utf-8');
  } catch (error) {
    throw new ParseError(
      `Failed to read file: ${path}`,
      'FILE_READ_ERROR'
    );
  }

  // Find first non-empty line
  const lines = content.split('\n').map(line => line.trim());
  const puzzleLine = lines.find(line => line.length > 0);

  if (!puzzleLine) {
    throw new ParseError(
      `File is empty or contains only whitespace: ${path}`,
      'FILE_EMPTY'
    );
  }

  return puzzleLine;
}

/**
 * Resolve input to a puzzle string
 * 
 * Determines if input is a literal string or file path and returns the puzzle string
 * 
 * @param input - Either an 81-char puzzle string or a file path
 * @returns Promise<string> - The puzzle string
 * @throws ParseError if input cannot be resolved
 */
export async function resolveInputToString(input: string): Promise<string> {
  // If input is exactly 81 chars and contains only valid chars, treat as literal
  if (input.length === TOTAL_CELLS && /^[0-9.]+$/.test(input)) {
    return input;
  }

  // Otherwise, try to load from file
  return await loadPuzzleFromFile(input);
}

/**
 * Parse input (string or file) into a Grid
 * 
 * High-level function that handles both literal strings and file paths
 * 
 * @param input - Either an 81-char puzzle string or a file path
 * @returns Promise<Grid> - The parsed grid
 * @throws ParseError if input is invalid
 */
export async function parseInput(input: string): Promise<Grid> {
  const puzzleString = await resolveInputToString(input);
  return parsePuzzleString(puzzleString);
}

/**
 * Format a Grid back to an 81-character string
 * 
 * @param grid - 9x9 Grid to format
 * @param useZero - If true, use '0' for empty cells; otherwise use '.'
 * @returns string - 81-character puzzle string
 */
export function formatGrid(grid: Grid, useZero = true): string {
  let result = '';
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row][col];
      if (value === 0) {
        result += useZero ? '0' : '.';
      } else {
        result += value.toString();
      }
    }
  }
  return result;
}
