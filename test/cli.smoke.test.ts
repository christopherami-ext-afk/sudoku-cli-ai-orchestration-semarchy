import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, unlinkSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = join(__dirname, '..', 'dist', 'cli.js');

interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

function execCLI(args: string[]): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn('node', [CLI_PATH, ...args]);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

describe('CLI Smoke Tests', () => {
  describe('help commands', () => {
    it('should show help when no arguments provided', async () => {
      const result = await execCLI([]);
      
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('sudoku'));
      assert.ok(result.stdout.includes('validate'));
      assert.ok(result.stdout.includes('solve'));
      assert.ok(result.stdout.includes('generate'));
    });

    it('should show help with --help flag', async () => {
      const result = await execCLI(['--help']);
      
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('sudoku'));
    });

    it('should show validate help', async () => {
      const result = await execCLI(['validate', '--help']);
      
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('validate'));
      assert.ok(result.stdout.includes('--input'));
    });

    it('should show solve help', async () => {
      const result = await execCLI(['solve', '--help']);
      
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('solve'));
      assert.ok(result.stdout.includes('--input'));
    });

    it('should show generate help', async () => {
      const result = await execCLI(['generate', '--help']);
      
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('generate'));
      assert.ok(result.stdout.includes('--difficulty'));
      assert.ok(result.stdout.includes('--seed'));
    });
  });

  describe('validate command', () => {
    it('should validate a valid incomplete puzzle (literal string)', async () => {
      const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const result = await execCLI(['validate', '--input', puzzle]);
      
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('Valid') || result.stdout.includes('valid'));
    });

    it('should validate a valid complete puzzle', async () => {
      const puzzle = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
      const result = await execCLI(['validate', '--input', puzzle]);
      
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('Valid') || result.stdout.includes('valid'));
      assert.ok(result.stdout.includes('complete'));
    });

    it('should reject an invalid puzzle (row duplicate)', async () => {
      const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080077';
      const result = await execCLI(['validate', '--input', puzzle]);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stdout.includes('Invalid') || result.stdout.includes('invalid') ||
                result.stderr.includes('Invalid') || result.stderr.includes('invalid'));
    });

    it('should validate from file', async () => {
      const filePath = join(__dirname, 'fixtures', 'valid-incomplete.txt');
      const result = await execCLI(['validate', '--input', filePath]);
      
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('Valid') || result.stdout.includes('valid'));
    });

    it('should reject invalid input length', async () => {
      const puzzle = '123';
      const result = await execCLI(['validate', '--input', puzzle]);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('81') || result.stderr.includes('length'));
    });

    it('should require --input option', async () => {
      const result = await execCLI(['validate']);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('--input'));
    });
  });

  describe('solve command', () => {
    it('should solve a known puzzle', async () => {
      const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const result = await execCLI(['solve', '--input', puzzle]);
      
      assert.strictEqual(result.code, 0);
      
      // Output should be an 81-character solution
      const lines = result.stdout.trim().split('\n');
      const solution = lines[lines.length - 1];
      assert.strictEqual(solution.length, 81);
      assert.ok(/^[1-9]+$/.test(solution), 'Solution should only contain digits 1-9');
    });

    it('should solve from file', async () => {
      const filePath = join(__dirname, 'fixtures', 'valid-incomplete.txt');
      const result = await execCLI(['solve', '--input', filePath]);
      
      assert.strictEqual(result.code, 0);
      const lines = result.stdout.trim().split('\n');
      const solution = lines[lines.length - 1];
      assert.strictEqual(solution.length, 81);
    });

    it('should reject an invalid puzzle', async () => {
      const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080077';
      const result = await execCLI(['solve', '--input', puzzle]);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('Invalid') || result.stderr.includes('invalid') ||
                result.stdout.includes('Invalid') || result.stdout.includes('invalid'));
    });

    it('should reject an unsolvable puzzle', async () => {
      const filePath = join(__dirname, 'fixtures', 'unsolvable.txt');
      const result = await execCLI(['solve', '--input', filePath]);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('unsolvable') || result.stderr.includes('Invalid') ||
                result.stdout.includes('unsolvable') || result.stdout.includes('Invalid'));
    });

    it('should require --input option', async () => {
      const result = await execCLI(['solve']);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('--input'));
    });
  });

  describe('generate command', () => {
    it('should generate an easy puzzle with seed', async () => {
      const result = await execCLI(['generate', '--difficulty', 'easy', '--seed', '42']);
      
      assert.strictEqual(result.code, 0);
      
      // Output should be an 81-character puzzle
      const lines = result.stdout.trim().split('\n');
      const puzzle = lines[lines.length - 1];
      assert.strictEqual(puzzle.length, 81);
      assert.ok(/^[0-9.]+$/.test(puzzle), 'Puzzle should contain digits and 0 or .');
    });

    it('should generate a medium puzzle', async () => {
      const result = await execCLI(['generate', '--difficulty', 'medium', '--seed', '123']);
      
      assert.strictEqual(result.code, 0);
      const lines = result.stdout.trim().split('\n');
      const puzzle = lines[lines.length - 1];
      assert.strictEqual(puzzle.length, 81);
    });

    it('should generate a hard puzzle', async () => {
      const result = await execCLI(['generate', '--difficulty', 'hard', '--seed', '456']);
      
      assert.strictEqual(result.code, 0);
      const lines = result.stdout.trim().split('\n');
      const puzzle = lines[lines.length - 1];
      assert.strictEqual(puzzle.length, 81);
    });

    it('should be deterministic (same seed = same puzzle)', async () => {
      const result1 = await execCLI(['generate', '--difficulty', 'easy', '--seed', '999']);
      const result2 = await execCLI(['generate', '--difficulty', 'easy', '--seed', '999']);
      
      assert.strictEqual(result1.code, 0);
      assert.strictEqual(result2.code, 0);
      
      const lines1 = result1.stdout.trim().split('\n');
      const lines2 = result2.stdout.trim().split('\n');
      const puzzle1 = lines1[lines1.length - 1];
      const puzzle2 = lines2[lines2.length - 1];
      
      assert.strictEqual(puzzle1, puzzle2);
    });

    it('should require --difficulty option', async () => {
      const result = await execCLI(['generate', '--seed', '42']);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('--difficulty'));
    });

    it('should require --seed option', async () => {
      const result = await execCLI(['generate', '--difficulty', 'easy']);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('--seed'));
    });

    it('should reject invalid difficulty', async () => {
      const result = await execCLI(['generate', '--difficulty', 'insane', '--seed', '42']);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('difficulty') || result.stderr.includes('easy') ||
                result.stderr.includes('medium') || result.stderr.includes('hard'));
    });
  });

  describe('end-to-end workflow', () => {
    it('should generate, validate, and solve a puzzle', async () => {
      // Step 1: Generate
      const genResult = await execCLI(['generate', '--difficulty', 'easy', '--seed', '42']);
      assert.strictEqual(genResult.code, 0);
      
      const lines = genResult.stdout.trim().split('\n');
      const puzzle = lines[lines.length - 1];
      assert.strictEqual(puzzle.length, 81);
      
      // Step 2: Validate
      const valResult = await execCLI(['validate', '--input', puzzle]);
      assert.strictEqual(valResult.code, 0);
      assert.ok(valResult.stdout.includes('Valid') || valResult.stdout.includes('valid'));
      
      // Step 3: Solve
      const solveResult = await execCLI(['solve', '--input', puzzle]);
      assert.strictEqual(solveResult.code, 0);
      
      const solutionLines = solveResult.stdout.trim().split('\n');
      const solution = solutionLines[solutionLines.length - 1];
      assert.strictEqual(solution.length, 81);
      assert.ok(/^[1-9]+$/.test(solution));
    });

    it('should handle file-based workflow', async () => {
      const tempFile = join(__dirname, '..', 'temp-puzzle.txt');
      
      try {
        // Generate and save to file
        const genResult = await execCLI(['generate', '--difficulty', 'medium', '--seed', '100']);
        const lines = genResult.stdout.trim().split('\n');
        const puzzle = lines[lines.length - 1];
        writeFileSync(tempFile, puzzle);
        
        // Validate from file
        const valResult = await execCLI(['validate', '--input', tempFile]);
        assert.strictEqual(valResult.code, 0);
        
        // Solve from file
        const solveResult = await execCLI(['solve', '--input', tempFile]);
        assert.strictEqual(solveResult.code, 0);
      } finally {
        // Clean up
        try {
          unlinkSync(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('error handling', () => {
    it('should handle unknown command', async () => {
      const result = await execCLI(['unknown']);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('Unknown') || result.stderr.includes('unknown'));
    });

    it('should handle file not found', async () => {
      const result = await execCLI(['validate', '--input', 'nonexistent-file.txt']);
      
      assert.notStrictEqual(result.code, 0);
      assert.ok(result.stderr.includes('not found') || result.stderr.includes('ENOENT') ||
                result.stderr.includes('error'));
    });
  });
});
