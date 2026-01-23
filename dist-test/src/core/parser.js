import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
/**
 * Custom error class for parsing errors
 */
export class ParseError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ParseError';
    }
}
/**
 * Parse an 81-character puzzle string into a 9x9 Grid
 *
 * @param input - String of exactly 81 characters (digits 1-9, 0, or .)
 * @returns Grid - 9x9 array with 0 for empty cells, 1-9 for filled cells
 * @throws ParseError if input is invalid
 */
export function parsePuzzleString(input) {
    // Check length
    if (input.length !== 81) {
        throw new ParseError('INVALID_LENGTH', `Puzzle must be exactly 81 characters, got ${input.length}`);
    }
    // Check characters and build grid
    const grid = [];
    for (let i = 0; i < 81; i++) {
        const char = input[i];
        const row = Math.floor(i / 9);
        const col = i % 9;
        // Initialize row if needed
        if (!grid[row]) {
            grid[row] = [];
        }
        // Parse character
        let value;
        if (char >= '1' && char <= '9') {
            value = parseInt(char, 10);
        }
        else if (char === '0' || char === '.') {
            value = 0; // Normalize empties to 0
        }
        else {
            throw new ParseError('INVALID_CHARACTER', `Invalid character '${char}' at position ${i}. Allowed: 1-9, 0, or .`);
        }
        grid[row][col] = value;
    }
    return grid;
}
/**
 * Load puzzle string from a file
 *
 * Reads the first non-empty line from the file as the puzzle string.
 *
 * @param path - Path to file containing puzzle
 * @returns Promise<string> - The puzzle string
 * @throws ParseError if file is missing, unreadable, or has no valid content
 */
export async function loadPuzzleFromFile(path) {
    // Check if file exists
    if (!existsSync(path)) {
        throw new ParseError('FILE_NOT_FOUND', `File not found: ${path}`);
    }
    try {
        const content = await readFile(path, 'utf-8');
        // Find first non-empty line
        const lines = content.split(/\r?\n/);
        const firstLine = lines.find(line => line.trim().length > 0);
        if (!firstLine) {
            throw new ParseError('EMPTY_FILE', `File is empty or contains no puzzle data: ${path}`);
        }
        return firstLine.trim();
    }
    catch (error) {
        if (error instanceof ParseError) {
            throw error;
        }
        throw new ParseError('FILE_READ_ERROR', `Failed to read file: ${path}. ${error.message}`);
    }
}
/**
 * Resolve input argument to a puzzle string
 *
 * Simple heuristic: if input looks like a file path (has extension or path separators),
 * treat it as a file. Otherwise treat as literal string.
 *
 * @param input - Either an 81-char string or a file path
 * @returns Promise<string> - The puzzle string
 */
export async function resolveInputToString(input) {
    // Heuristic: if it has path separators or common file extensions, treat as file
    const looksLikeFile = input.includes('/') ||
        input.includes('\\') ||
        input.endsWith('.txt') ||
        input.endsWith('.sud') ||
        input.endsWith('.sudoku');
    if (looksLikeFile) {
        return await loadPuzzleFromFile(input);
    }
    return input;
}
/**
 * Parse input (string or file) into a Grid
 *
 * Convenience function that combines resolveInputToString and parsePuzzleString.
 *
 * @param input - Either an 81-char string or a file path
 * @returns Promise<Grid> - Parsed 9x9 grid
 * @throws ParseError if parsing fails
 */
export async function parseInput(input) {
    const puzzleString = await resolveInputToString(input);
    return parsePuzzleString(puzzleString);
}
