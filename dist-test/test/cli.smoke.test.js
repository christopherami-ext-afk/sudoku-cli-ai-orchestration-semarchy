// Simple smoke tests that execute the built CLI.
// Uses a lightweight runner for Node < 20.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawnSync } from 'child_process';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = dirname(dirname(__dirname));
const fixturesDir = join(repoRoot, 'test', 'fixtures');
const distCli = join(repoRoot, 'dist', 'cli.js');
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
function readFixture(name) {
    return readFileSync(join(fixturesDir, name), 'utf8').trim();
}
function runCli(args) {
    const result = spawnSync(process.execPath, [distCli, ...args], {
        cwd: repoRoot,
        encoding: 'utf8'
    });
    return {
        code: result.status ?? 0,
        stdout: (result.stdout ?? '').toString().trim(),
        stderr: (result.stderr ?? '').toString().trim()
    };
}
const tests = [
    test('cli validate - valid incomplete fixture exits 0', () => {
        const filePath = join(fixturesDir, 'valid-incomplete.txt');
        const res = runCli(['validate', '--input', filePath]);
        assert(res.code === 0, `Expected exit 0, got ${res.code}. stderr: ${res.stderr}`);
        assert(res.stdout.includes('Valid puzzle (incomplete)'), `Unexpected stdout: ${res.stdout}`);
    }),
    test('cli validate - invalid fixture exits non-zero with message', () => {
        const filePath = join(fixturesDir, 'invalid-row-duplicate.txt');
        const res = runCli(['validate', '--input', filePath]);
        assert(res.code !== 0, `Expected non-zero exit, got ${res.code}`);
        assert(res.stderr.includes('Invalid puzzle: duplicate'), `Unexpected stderr: ${res.stderr}`);
    }),
    test('cli solve - solvable fixture outputs expected solution', () => {
        const puzzlePath = join(fixturesDir, 'solvable-puzzle.txt');
        const expectedSolution = readFixture('solvable-solution.txt');
        const res = runCli(['solve', '--input', puzzlePath]);
        assert(res.code === 0, `Expected exit 0, got ${res.code}. stderr: ${res.stderr}`);
        assert(res.stdout === expectedSolution, 'Solution output did not match expected fixture');
        assert(res.stdout.length === 81, `Expected 81 chars, got ${res.stdout.length}`);
    }),
    test('cli generate - deterministic output for same seed+difficulty', () => {
        const a = runCli(['generate', '--difficulty', 'easy', '--seed', '42']);
        const b = runCli(['generate', '--difficulty', 'easy', '--seed', '42']);
        assert(a.code === 0 && b.code === 0, `Expected exit 0. a=${a.code} b=${b.code}`);
        assert(a.stdout === b.stdout, 'Expected bit-identical puzzle outputs');
        assert(a.stdout.length === 81, `Expected 81 chars, got ${a.stdout.length}`);
    }),
    test('cli generate -> validate -> solve round-trip', () => {
        const gen = runCli(['generate', '--difficulty', 'easy', '--seed', '42']);
        assert(gen.code === 0, `Generate failed: ${gen.stderr}`);
        assert(gen.stdout.length === 81, `Expected 81 chars, got ${gen.stdout.length}`);
        const validate = runCli(['validate', '--input', gen.stdout]);
        assert(validate.code === 0, `Validate failed: ${validate.stderr}`);
        assert(validate.stdout.includes('Valid puzzle (incomplete)'), `Unexpected validate stdout: ${validate.stdout}`);
        const solve = runCli(['solve', '--input', gen.stdout]);
        assert(solve.code === 0, `Solve failed: ${solve.stderr}`);
        assert(solve.stdout.length === 81, `Expected 81 chars, got ${solve.stdout.length}`);
        assert(!solve.stdout.includes('0'), 'Solution should not contain 0');
    })
];
(async () => {
    console.log('Running CLI smoke tests...\n');
    for (const testFn of tests) {
        await testFn();
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
})();
