import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parsePuzzleString, resolveInputToString, ParseError } from '../src/core/parser.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Parser Tests', () => {
  describe('parsePuzzleString', () => {
    it('should parse a valid 81-character string with digits', () => {
      const input = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const grid = parsePuzzleString(input);
      
      assert.strictEqual(grid.length, 9);
      assert.strictEqual(grid[0].length, 9);
      assert.strictEqual(grid[0][0], 5);
      assert.strictEqual(grid[0][1], 3);
      assert.strictEqual(grid[0][3], 0); // empty cell
    });

    it('should parse a string with dots as empty cells', () => {
      const input = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
      const grid = parsePuzzleString(input);
      
      assert.strictEqual(grid.length, 9);
      assert.strictEqual(grid[0][2], 0); // dot converted to 0
      assert.strictEqual(grid[0][3], 0);
    });

    it('should parse a string with mixed 0s and dots', () => {
      const input = '530.70000600195000098000060800060003400803001700020006060000280000419005000080079';
      const grid = parsePuzzleString(input);
      
      assert.strictEqual(grid[0][3], 0); // both . and 0 become 0
    });

    it('should throw ParseError for invalid length (too short)', () => {
      const input = '12345';
      
      assert.throws(
        () => parsePuzzleString(input),
        (err: Error) => {
          return err instanceof ParseError &&
                 err.message.includes('expected 81 characters');
        }
      );
    });

    it('should throw ParseError for invalid length (too long)', () => {
      const input = '5'.repeat(100);
      
      assert.throws(
        () => parsePuzzleString(input),
        (err: Error) => {
          return err instanceof ParseError &&
                 err.message.includes('expected 81 characters');
        }
      );
    });

    it('should throw ParseError for invalid characters', () => {
      const input = 'x' + '0'.repeat(80);
      
      assert.throws(
        () => parsePuzzleString(input),
        (err: Error) => {
          return err instanceof ParseError &&
                 err.message.includes('Invalid character');
        }
      );
    });

    it('should throw ParseError for empty string', () => {
      assert.throws(
        () => parsePuzzleString(''),
        (err: Error) => {
          return err instanceof ParseError &&
                 err.message.includes('expected 81 characters');
        }
      );
    });
  });

  describe('resolveInputToString', () => {
    it('should load from a valid file', async () => {
      const filePath = join(__dirname, 'fixtures', 'valid-incomplete.txt');
      const puzzleStr = await resolveInputToString(filePath);
      
      assert.strictEqual(puzzleStr.length, 81);
      assert.strictEqual(puzzleStr[0], '5');
    });

    it('should treat a literal 81-char string as puzzle string', async () => {
      const input = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const puzzleStr = await resolveInputToString(input);
      
      assert.strictEqual(puzzleStr, input);
    });

    it('should throw ParseError for non-existent file', async () => {
      const filePath = join(__dirname, 'fixtures', 'nonexistent.txt');
      
      await assert.rejects(
        async () => resolveInputToString(filePath),
        (err: Error) => {
          return err instanceof ParseError &&
                 (err.message.includes('not found') || err.message.includes('ENOENT'));
        }
      );
    });

    it('should handle file with whitespace', async () => {
      const filePath = join(__dirname, 'fixtures', 'valid-incomplete.txt');
      const content = readFileSync(filePath, 'utf-8');
      
      // Verify fixture has trailing newline
      assert.ok(content.includes('\n') || content.length >= 81);
      
      const puzzleStr = await resolveInputToString(filePath);
      assert.strictEqual(puzzleStr.length, 81);
    });
  });

  describe('ParseError', () => {
    it('should have correct properties', () => {
      const error = new ParseError('Test error', 'length');
      
      assert.strictEqual(error.message, 'Test error');
      assert.strictEqual(error.code, 'length');
      assert.ok(error instanceof Error);
    });
  });
});
