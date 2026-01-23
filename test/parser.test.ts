// Simple test runner for Node < 20
import { parsePuzzleString, loadPuzzleFromFile, resolveInputToString, parseInput, ParseError } from '../src/core/parser.js';
import type { Grid } from '../src/types/grid.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(dirname(dirname(__dirname)), 'test', 'fixtures');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(`  ${(error as Error).message}`);
      failed++;
    }
  };
}

function assert(condition: boolean, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

async function assertRejects(fn: () => Promise<any>, check: (err: Error) => boolean) {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (!check(error as Error)) {
      throw new Error('Error check failed');
    }
  }
}

function assertThrows(fn: () => void, check: (err: Error) => boolean) {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (!check(error as Error)) {
      throw new Error('Error check failed');
    }
  }
}

// Tests
const tests = [
  test('parsePuzzleString - valid 81-char string with digits', () => {
    const input = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = parsePuzzleString(input);
    
    assertEqual(grid.length, 9);
    assertEqual(grid[0].length, 9);
    assertEqual(grid[0][0], 5);
    assertEqual(grid[0][1], 3);
    assertEqual(grid[0][2], 0);
  }),

  test('parsePuzzleString - valid string with dots for empties', () => {
    const input = '53..7....6..195....98....6.8...6...34..8.3..17....2...6.6....28....419..5....8..7';
    const grid = parsePuzzleString(input);
    
    assertEqual(grid[0][2], 0);
    assertEqual(grid[0][3], 0);
    assertEqual(grid[0][0], 5);
  }),

  test('parsePuzzleString - invalid length (too short)', () => {
    const input = '123';
    
    assertThrows(
      () => parsePuzzleString(input),
      (err: Error) => {
        assert(err instanceof ParseError, 'Should be ParseError');
        assertEqual((err as ParseError).code, 'INVALID_LENGTH');
        assert(err.message.includes('81'), 'Message should mention 81');
        return true;
      }
    );
  }),

  test('parsePuzzleString - invalid length (too long)', () => {
    const input = '5'.repeat(82);
    
    assertThrows(
      () => parsePuzzleString(input),
      (err: Error) => {
        assert(err instanceof ParseError);
        assertEqual((err as ParseError).code, 'INVALID_LENGTH');
        return true;
      }
    );
  }),

  test('parsePuzzleString - invalid character', () => {
    const input = 'x30070000600195000098000060800060003400803001700020006060000280000419005000080079';
    
    assertThrows(
      () => parsePuzzleString(input),
      (err: Error) => {
        assert(err instanceof ParseError);
        assertEqual((err as ParseError).code, 'INVALID_CHARACTER');
        assert(err.message.includes('x'), 'Message should mention invalid char');
        return true;
      }
    );
  }),

  test('parsePuzzleString - all zeros', () => {
    const input = '0'.repeat(81);
    const grid = parsePuzzleString(input);
    
    assertEqual(grid.length, 9);
    assertEqual(grid[0][0], 0);
    assertEqual(grid[8][8], 0);
  }),

  test('loadPuzzleFromFile - valid file', async () => {
    const filePath = join(fixturesDir, 'valid-incomplete.txt');
    const puzzleString = await loadPuzzleFromFile(filePath);
    
    assertEqual(puzzleString.length, 81);
    assertEqual(puzzleString[0], '5');
  }),

  test('loadPuzzleFromFile - file not found', async () => {
    const filePath = join(fixturesDir, 'nonexistent.txt');
    
    await assertRejects(
      async () => await loadPuzzleFromFile(filePath),
      (err: Error) => {
        assert(err instanceof ParseError);
        assertEqual((err as ParseError).code, 'FILE_NOT_FOUND');
        return true;
      }
    );
  }),

  test('loadPuzzleFromFile - empty file', async () => {
    const filePath = join(fixturesDir, 'empty-file.txt');
    
    await assertRejects(
      async () => await loadPuzzleFromFile(filePath),
      (err: Error) => {
        assert(err instanceof ParseError);
        assertEqual((err as ParseError).code, 'EMPTY_FILE');
        return true;
      }
    );
  }),

  test('resolveInputToString - literal string', async () => {
    const input = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const result = await resolveInputToString(input);
    
    assertEqual(result, input);
  }),

  test('resolveInputToString - file path with .txt', async () => {
    const filePath = join(fixturesDir, 'valid-incomplete.txt');
    const result = await resolveInputToString(filePath);
    
    assertEqual(result.length, 81);
    assertEqual(result[0], '5');
  }),

  test('parseInput - end to end with string', async () => {
    const input = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = await parseInput(input);
    
    assertEqual(grid.length, 9);
    assertEqual(grid[0][0], 5);
  }),

  test('parseInput - end to end with file', async () => {
    const filePath = join(fixturesDir, 'valid-incomplete.txt');
    const grid = await parseInput(filePath);
    
    assertEqual(grid.length, 9);
    assertEqual(grid[0][0], 5);
  })
];

// Run all tests
(async () => {
  console.log('Running parser tests...\n');
  
  for (const testFn of tests) {
    await testFn();
  }
  
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();

