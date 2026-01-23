// Simple test runner for Node < 20
import { generatePuzzle } from '../src/core/generator.js';
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
function gridToPuzzleString(grid) {
    return grid.flat().map((v) => (v === 0 ? '0' : String(v))).join('');
}
function countZeros(grid) {
    return grid.flat().filter((v) => v === 0).length;
}
// Tests
const tests = [
    test('generatePuzzle - deterministic for same seed+difficulty', () => {
        const a = generatePuzzle({ difficulty: 'easy', seed: 42 });
        const b = generatePuzzle({ difficulty: 'easy', seed: 42 });
        assertEqual(gridToPuzzleString(a.puzzle), gridToPuzzleString(b.puzzle));
        assertEqual(gridToPuzzleString(a.solution), gridToPuzzleString(b.solution));
    }),
    test('generatePuzzle - different seed produces different puzzle (usually)', () => {
        const a = generatePuzzle({ difficulty: 'easy', seed: 1 });
        const b = generatePuzzle({ difficulty: 'easy', seed: 2 });
        // Not a strict mathematical guarantee, but should be true for our strategy.
        assert(gridToPuzzleString(a.puzzle) !== gridToPuzzleString(b.puzzle), 'Expected different puzzles for different seeds');
    }),
    test('generatePuzzle - easy removal count', () => {
        const { puzzle } = generatePuzzle({ difficulty: 'easy', seed: 42 });
        assertEqual(countZeros(puzzle), 36);
    }),
    test('generatePuzzle - medium removal count', () => {
        const { puzzle } = generatePuzzle({ difficulty: 'medium', seed: 42 });
        assertEqual(countZeros(puzzle), 46);
    }),
    test('generatePuzzle - hard removal count', () => {
        const { puzzle } = generatePuzzle({ difficulty: 'hard', seed: 42 });
        assertEqual(countZeros(puzzle), 54);
    }),
    test('generatePuzzle - puzzle validates and is solvable', () => {
        const { puzzle } = generatePuzzle({ difficulty: 'medium', seed: 42 });
        const validation = validateGrid(puzzle);
        assert(validation.status !== 'invalid', 'Expected generated puzzle to be valid');
        assert(validation.status === 'valid-incomplete', 'Expected generated puzzle to be incomplete');
        const solved = solveGrid(puzzle);
        assert(solved.solved, 'Expected solver to solve generated puzzle');
        const solvedValidation = validateGrid(solved.grid);
        assertEqual(solvedValidation.status, 'valid-complete');
    })
];
// Run all tests
(async () => {
    console.log('Running generator tests...\n');
    for (const testFn of tests) {
        await testFn();
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
})();
