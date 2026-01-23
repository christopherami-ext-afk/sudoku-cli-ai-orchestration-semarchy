import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parsePuzzleString } from '../src/core/parser.js';
import { validateGrid } from '../src/core/validator.js';
import { solveGrid } from '../src/core/solver.js';
let passed = 0;
let failed = 0;
function test(name, fn) {
    return async () => {
        try {
            await fn();
            console.log(`✓ ${name}`);
            passed++;
        }
        catch (error) {
            console.error(`✗ ${name}`);
            console.error(`  ${error.message}`);
            failed++;
        }
    };
}
function assert(condition, message = 'Assertion failed') {
    if (!condition) {
        throw new Error(message);
    }
}
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(dirname(dirname(__dirname)), 'test', 'fixtures');
async function readFixture(name) {
    const p = join(fixturesDir, name);
    const raw = await readFile(p, 'utf-8');
    return raw.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim() ?? '';
}
function gridTo81(grid) {
    return grid.flat().join('');
}
const tests = [
    test('solveGrid - solves known puzzle to expected solution', async () => {
        const puzzle = await readFixture('solvable-puzzle.txt');
        const expectedSolution = await readFixture('solvable-solution.txt');
        assertEqual(puzzle.length, 81);
        assertEqual(expectedSolution.length, 81);
        const inputGrid = parsePuzzleString(puzzle);
        const result = solveGrid(inputGrid);
        assertEqual(result.solved, true);
        assert(!!result.grid, 'Expected solved grid');
        const solvedString = gridTo81(result.grid);
        assertEqual(solvedString, expectedSolution);
        const validation = validateGrid(result.grid);
        assertEqual(validation.status, 'valid-complete');
    }),
    test('solveGrid - does not mutate input grid', () => {
        const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
        const originalGrid = parsePuzzleString(puzzle);
        const snapshot = gridTo81(originalGrid);
        const result = solveGrid(originalGrid);
        assertEqual(result.solved, true);
        // Input grid should be unchanged
        assertEqual(gridTo81(originalGrid), snapshot);
    }),
    test('solveGrid - preserves given clues', () => {
        const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
        const originalGrid = parsePuzzleString(puzzle);
        const result = solveGrid(originalGrid);
        assertEqual(result.solved, true);
        assert(!!result.grid, 'Expected solved grid');
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (originalGrid[r][c] !== 0) {
                    assertEqual(result.grid[r][c], originalGrid[r][c]);
                }
            }
        }
    }),
    test('solveGrid - returns invalid for invalid puzzle', () => {
        const invalid = '553070000600195000098000060800060003400803001700020006060000280000419005000080079';
        const grid = parsePuzzleString(invalid);
        const validation = validateGrid(grid);
        assertEqual(validation.status, 'invalid');
        const result = solveGrid(grid);
        assertEqual(result.solved, false);
        assertEqual(result.reason, 'invalid');
    }),
    test('solveGrid - returns unsolvable for structurally-valid but unsatisfiable puzzle', () => {
        const puzzle = '123456780000000009000000000000000000000000000000000000000000000000000000000000000';
        const grid = parsePuzzleString(puzzle);
        const validation = validateGrid(grid);
        assertEqual(validation.status, 'valid-incomplete');
        const result = solveGrid(grid);
        assertEqual(result.solved, false);
        assertEqual(result.reason, 'unsolvable');
    }),
    test('solveGrid - deterministic (same input => same solution)', () => {
        const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
        const grid1 = parsePuzzleString(puzzle);
        const grid2 = parsePuzzleString(puzzle);
        const r1 = solveGrid(grid1);
        const r2 = solveGrid(grid2);
        assertEqual(r1.solved, true);
        assertEqual(r2.solved, true);
        assertEqual(gridTo81(r1.grid), gridTo81(r2.grid));
    })
];
(async () => {
    console.log('Running solver tests...\n');
    for (const t of tests) {
        await t();
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
})();
