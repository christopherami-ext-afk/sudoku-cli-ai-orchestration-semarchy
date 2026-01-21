# AI-Readiness Guide

This document provides a comprehensive guide for AI coding assistants and developers working on the Sudoku CLI project. It describes the codebase structure, conventions, safe extension points, and best practices.

## Quick Start for AI Assistants

### Entry Points
- **Main CLI**: `src/cli.ts` - Command-line argument parsing and dispatch
- **Commands**: `src/commands/` - Command handlers (validate, solve, generate)
- **Core Logic**: `src/core/` - Domain logic (parser, validator, solver, generator)
- **Types**: `src/types/grid.ts` - Core data structures

### Key Conventions
1. **Grid representation**: 9×9 array (`Grid = CellValue[][]`)
2. **Empty cells**: Represented as `0` (type: `CellValue`)
3. **Filled cells**: Values `1-9` (type: `CellValue`)
4. **Error handling**: Use `ParseError` for parsing, return result types for validation/solving
5. **Determinism**: All operations must be deterministic (no `Math.random()` in core logic)

### Running the Code
```bash
npm run build        # Compile TypeScript
npm run typecheck    # Type check without emitting
npm test            # Run all tests
npm run cli -- <command> [options]  # Run CLI during development
```

---

## Project Structure

```
sudoku-cli/
├── src/
│   ├── cli.ts                 # Main entry point
│   ├── commands/              # Command implementations
│   │   ├── validate.ts        # validate command
│   │   ├── solve.ts           # solve command
│   │   └── generate.ts        # generate command
│   ├── core/                  # Core domain logic
│   │   ├── parser.ts          # Input parsing
│   │   ├── validator.ts       # Rule validation
│   │   ├── solver.ts          # Puzzle solving
│   │   ├── generator.ts       # Puzzle generation
│   │   └── prng.ts            # Pseudo-random number generator
│   └── types/
│       └── grid.ts            # Type definitions
├── test/                      # Tests
│   ├── parser.test.ts
│   ├── validator.test.ts
│   ├── solver.test.ts
│   ├── generator.test.ts
│   └── cli.smoke.test.ts
├── examples/                  # Example puzzle files
├── dist/                      # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Types and Data Structures

### Grid Representation

```typescript
// src/types/grid.ts

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Grid = CellValue[][];

export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const TOTAL_CELLS = 81;
```

**Key Points:**
- `Grid` is always 9×9
- `CellValue = 0` means empty
- `CellValue = 1-9` means filled
- Access: `grid[row][col]` where `row, col ∈ [0, 8]`

### Box Indexing

Boxes are numbered 0-8:
```
┌───┬───┬───┐
│ 0 │ 1 │ 2 │
├───┼───┼───┤
│ 3 │ 4 │ 5 │
├───┼───┼───┤
│ 6 │ 7 │ 8 │
└───┴───┴───┘
```

Calculate box index from `(row, col)`:
```typescript
const boxRow = Math.floor(row / 3);
const boxCol = Math.floor(col / 3);
const boxIndex = boxRow * 3 + boxCol;
```

---

## Module APIs

### Parser (`src/core/parser.ts`)

**Purpose**: Convert user input (strings or files) to `Grid` objects.

**Public API:**

```typescript
// Parse an 81-char string to Grid
function parsePuzzleString(input: string): Grid
// Throws ParseError on invalid input

// Load puzzle string from file
async function loadPuzzleFromFile(path: string): Promise<string>
// Throws ParseError if file not found/readable/empty

// Resolve input to string (auto-detect literal vs file)
async function resolveInputToString(input: string): Promise<string>
// Throws ParseError

// High-level: parse from string or file
async function parseInput(input: string): Promise<Grid>
// Throws ParseError

// Convert Grid back to 81-char string
function formatGrid(grid: Grid, useZero?: boolean): string
// useZero=true (default): empty cells as '0'
// useZero=false: empty cells as '.'
```

**Error Handling:**
```typescript
class ParseError extends Error {
  constructor(message: string, public code: string)
}

// Error codes:
// - INVALID_LENGTH
// - INVALID_CHARACTER
// - FILE_NOT_FOUND
// - FILE_READ_ERROR
// - FILE_EMPTY
```

**Example Usage:**
```typescript
import { parseInput, formatGrid } from './core/parser.js';

try {
  const grid = await parseInput("530070000...");
  console.log("Parsed successfully");
  const str = formatGrid(grid);
  console.log(str);
} catch (error) {
  if (error instanceof ParseError) {
    console.error(`Parse error: ${error.message}`);
  }
}
```

---

### Validator (`src/core/validator.ts`)

**Purpose**: Check if a grid follows Sudoku rules.

**Public API:**

```typescript
type ValidationStatus = 'valid-complete' | 'valid-incomplete' | 'invalid';

interface ValidationIssue {
  type: 'row' | 'column' | 'box';
  index: number;  // 0-based (row/column/box number)
  value: number;  // The duplicate digit
}

interface ValidationResult {
  status: ValidationStatus;
  issues: ValidationIssue[];  // Empty if valid
}

function validateGrid(grid: Grid): ValidationResult
```

**Helper Functions (exported):**
```typescript
function getRow(grid: Grid, rowIndex: number): CellValue[]
function getColumn(grid: Grid, colIndex: number): CellValue[]
function getBox(grid: Grid, boxIndex: number): CellValue[]
```

**Example Usage:**
```typescript
import { validateGrid } from './core/validator.js';

const result = validateGrid(grid);

if (result.status === 'invalid') {
  console.error('Invalid puzzle:');
  for (const issue of result.issues) {
    console.error(`  Duplicate ${issue.value} in ${issue.type} ${issue.index + 1}`);
  }
} else if (result.status === 'valid-complete') {
  console.log('Valid and complete');
} else {
  console.log('Valid but incomplete');
}
```

---

### Solver (`src/core/solver.ts`)

**Purpose**: Solve Sudoku puzzles using backtracking.

**Public API:**

```typescript
interface SolveResult {
  solved: boolean;
  grid?: Grid;      // Present if solved=true
  reason?: string;  // Present if solved=false (e.g., "unsolvable")
}

function solveGrid(grid: Grid): SolveResult
```

**Algorithm:**
- Deterministic backtracking
- Cells chosen in row-major order (top-left to bottom-right)
- Digits tried in ascending order (1, 2, 3, ..., 9)
- Fast constraint checking (no full grid validation on each step)

**Example Usage:**
```typescript
import { solveGrid } from './core/solver.js';

const result = solveGrid(grid);

if (result.solved && result.grid) {
  console.log('Solution found');
  const solution = formatGrid(result.grid);
  console.log(solution);
} else {
  console.error(`Failed to solve: ${result.reason}`);
}
```

**Important:** The solver is deterministic. Same puzzle → same solution path → same result.

---

### Generator (`src/core/generator.ts`)

**Purpose**: Generate valid, solvable Sudoku puzzles with difficulty levels.

**Public API:**

```typescript
type Difficulty = 'easy' | 'medium' | 'hard';

interface GenerateOptions {
  difficulty: Difficulty;
  seed: number;
}

interface GenerateResult {
  puzzle: Grid;    // Puzzle with empty cells
  solution: Grid;  // Complete solution
}

function generatePuzzle(opts: GenerateOptions): GenerateResult
```

**Difficulty Heuristics:**
- **Easy**: 40-45 clues, straightforward solving
- **Medium**: 30-35 clues, moderate complexity
- **Hard**: 25-30 clues, advanced techniques required

**Determinism:**
- Uses `prng.ts` for deterministic randomness
- Same `seed` + `difficulty` → exact same puzzle
- Critical for testing and reproducibility

**Example Usage:**
```typescript
import { generatePuzzle } from './core/generator.js';

const result = generatePuzzle({ difficulty: 'easy', seed: 42 });
console.log('Puzzle:', formatGrid(result.puzzle));
console.log('Solution:', formatGrid(result.solution));

// Verify puzzle is valid and solvable
const validation = validateGrid(result.puzzle);
const solvability = solveGrid(result.puzzle);
```

---

### PRNG (`src/core/prng.ts`)

**Purpose**: Provide deterministic pseudo-random number generation.

**Public API:**

```typescript
function createPrng(seed: number): () => number
// Returns a function that generates random numbers [0, 1)
```

**Implementation**: Linear Congruential Generator (LCG)

**Example Usage:**
```typescript
import { createPrng } from './core/prng.js';

const random = createPrng(42);

// Generate random numbers
const r1 = random();  // e.g., 0.12345
const r2 = random();  // e.g., 0.67890

// Same seed → same sequence
const random2 = createPrng(42);
const r3 = random2();  // Same as r1
```

**Important:** Never use `Math.random()` in core logic. Always use the seeded PRNG for reproducibility.

---

## Commands

### Command Structure

All commands follow this pattern:

```typescript
// src/commands/[command].ts

export async function run[Command]Command(args: string[]): Promise<void> {
  // 1. Check for --help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    return;
  }

  // 2. Parse required options
  const inputIndex = args.indexOf('--input');
  if (inputIndex === -1 || inputIndex === args.length - 1) {
    console.error('Error: --input option is required');
    console.error(`Run 'sudoku [command] --help' for usage information.`);
    process.exit(1);
  }

  const input = args[inputIndex + 1];

  try {
    // 3. Call core logic
    const grid = await parseInput(input);
    const result = /* call validator/solver/generator */;

    // 4. Format output
    console.log(/* formatted result */);
    process.exit(0);
  } catch (error) {
    // 5. Handle errors
    if (error instanceof ParseError) {
      console.error(`Parse error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}
```

### Adding a New Command

1. **Create command file**: `src/commands/newcommand.ts`
2. **Implement handler**:
   ```typescript
   const NEW_COMMAND_HELP = `...`;
   
   export async function runNewCommand(args: string[]): Promise<void> {
     // Implementation
   }
   ```
3. **Update CLI dispatcher**: `src/cli.ts`
   ```typescript
   import { runNewCommand } from './commands/newcommand.js';
   
   // In main():
   switch (command) {
     // ... existing cases ...
     case 'newcommand':
       await runNewCommand(commandArgs);
       break;
   }
   ```
4. **Update help text** in `src/cli.ts`:
   ```typescript
   const HELP_TEXT = `
   ...
   COMMANDS:
     validate     Validate a Sudoku puzzle
     solve        Solve a Sudoku puzzle
     generate     Generate a new Sudoku puzzle
     newcommand   Description of new command
   `;
   ```
5. **Add tests**: `test/newcommand.test.ts`
6. **Update documentation**: `README.md`, `COMMANDS.md`

---

## Safe Extension Points

### 1. Adding Validation Rules

**Location**: `src/core/validator.ts`

**How**:
1. Add new issue type to `ValidationIssue.type`:
   ```typescript
   interface ValidationIssue {
     type: 'row' | 'column' | 'box' | 'new-rule';
     // ...
   }
   ```
2. Implement check in `validateGrid`:
   ```typescript
   export function validateGrid(grid: Grid): ValidationResult {
     const issues: ValidationIssue[] = [];
     
     // Existing checks...
     
     // New check
     const newIssues = checkNewRule(grid);
     issues.push(...newIssues);
     
     // ...
   }
   ```
3. Add helper function:
   ```typescript
   function checkNewRule(grid: Grid): ValidationIssue[] {
     // Implementation
   }
   ```
4. **Add tests** for the new rule

**Caution**: Don't change existing rule behavior without careful consideration.

---

### 2. Adding Difficulty Levels

**Location**: `src/core/generator.ts`

**How**:
1. Update `Difficulty` type:
   ```typescript
   export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
   ```
2. Add heuristics in generation logic:
   ```typescript
   function getClueCount(difficulty: Difficulty): [number, number] {
     switch (difficulty) {
       case 'easy': return [40, 45];
       case 'medium': return [30, 35];
       case 'hard': return [25, 30];
       case 'expert': return [20, 25];  // New
     }
   }
   ```
3. Update command validation in `src/commands/generate.ts`:
   ```typescript
   if (!['easy', 'medium', 'hard', 'expert'].includes(difficulty)) {
     console.error(`Error: Invalid difficulty '${difficulty}'. Must be 'easy', 'medium', 'hard', or 'expert'`);
     process.exit(1);
   }
   ```
4. **Add tests** for the new difficulty
5. **Update documentation**

---

### 3. Adding Output Formats

**Location**: `src/core/parser.ts` or new module

**How**:
1. Create formatting function:
   ```typescript
   // src/core/formatter.ts
   export function formatGridAsJson(grid: Grid): string {
     return JSON.stringify(grid);
   }
   
   export function formatGridAsAscii(grid: Grid): string {
     // Pretty ASCII grid with boxes
   }
   ```
2. Add `--format` option to commands:
   ```typescript
   // In command handler
   const formatIndex = args.indexOf('--format');
   const format = formatIndex !== -1 ? args[formatIndex + 1] : 'default';
   
   let output: string;
   switch (format) {
     case 'json':
       output = formatGridAsJson(grid);
       break;
     case 'ascii':
       output = formatGridAsAscii(grid);
       break;
     default:
       output = formatGrid(grid);
   }
   ```
3. **Add tests**
4. **Update documentation**

---

### 4. Enhancing the Solver

**Location**: `src/core/solver.ts`

**Safe Changes**:
- Add heuristics (e.g., most-constrained-variable, forward checking)
- Improve performance (e.g., bitset constraints)
- Add solution counting (for generator validation)

**How**:
1. Keep the same public API:
   ```typescript
   export function solveGrid(grid: Grid): SolveResult
   ```
2. Enhance internal implementation:
   ```typescript
   function backtrack(grid: Grid, ...): boolean {
     // New heuristics here
   }
   ```
3. **Maintain determinism**: Ensure same puzzle → same solution
4. **Add performance tests**
5. **Verify all existing tests still pass**

**Caution**: Don't break determinism - it's critical for generator testing.

---

## Error Handling Conventions

### Parse Errors

**Use**: `ParseError` class
**When**: Input format issues (length, characters, file I/O)
**Handling**: Catch in command handlers, report to user, exit 1

```typescript
try {
  const grid = await parseInput(input);
} catch (error) {
  if (error instanceof ParseError) {
    console.error(`Parse error: ${error.message}`);
    process.exit(1);
  }
  throw error;  // Unexpected errors re-thrown
}
```

### Validation Errors

**Use**: `ValidationResult` with `status: 'invalid'`
**When**: Sudoku rule violations
**Handling**: Check status, report issues, exit 1

```typescript
const result = validateGrid(grid);
if (result.status === 'invalid') {
  console.error('Invalid puzzle:');
  for (const issue of result.issues) {
    console.error(`  - Duplicate ${issue.value} in ${issue.type} ${issue.index + 1}`);
  }
  process.exit(1);
}
```

### Solving Failures

**Use**: `SolveResult` with `solved: false`
**When**: Puzzle is unsolvable (not an error, expected case)
**Handling**: Check `solved` flag, report reason, exit 1

```typescript
const result = solveGrid(grid);
if (!result.solved) {
  console.error(`Puzzle is ${result.reason || 'unsolvable'}`);
  process.exit(1);
}
```

### Unexpected Errors

**Use**: Re-throw or catch at top level
**When**: Programming errors, system failures
**Handling**: Log error, exit 1

```typescript
// In cli.ts
main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
```

---

## Testing Strategy

### Unit Tests

**Framework**: Node.js built-in test runner (`node:test`)

**Location**: `test/*.test.ts`

**Running**: `npm test`

**Structure**:
```typescript
import { test } from 'node:test';
import assert from 'node:assert';

test('parser: valid 81-char string', () => {
  const grid = parsePuzzleString("530070000...");
  assert.strictEqual(grid.length, 9);
  assert.strictEqual(grid[0][0], 5);
});

test('validator: detects row duplicate', () => {
  const grid = /* ... grid with duplicate ... */;
  const result = validateGrid(grid);
  assert.strictEqual(result.status, 'invalid');
  assert.strictEqual(result.issues.length, 1);
  assert.strictEqual(result.issues[0].type, 'row');
});
```

### Test Coverage Checklist

#### Parser Tests
- ✓ Valid 81-char string
- ✓ Invalid length (too short, too long)
- ✓ Invalid characters
- ✓ File input (valid file)
- ✓ File not found
- ✓ Empty file
- ✓ Format grid (with zeros, with dots)

#### Validator Tests
- ✓ Valid complete puzzle
- ✓ Valid incomplete puzzle
- ✓ Invalid: row duplicate
- ✓ Invalid: column duplicate
- ✓ Invalid: box duplicate
- ✓ Multiple duplicates

#### Solver Tests
- ✓ Solve known puzzle (verify solution)
- ✓ Unsolvable puzzle (structurally valid but no solution)
- ✓ Invalid puzzle (reject before solving)
- ✓ Already complete puzzle
- ✓ Determinism (same puzzle → same solution)

#### Generator Tests
- ✓ Generate easy puzzle (verify valid and solvable)
- ✓ Generate medium puzzle
- ✓ Generate hard puzzle
- ✓ Determinism (same seed → same puzzle)
- ✓ Different seeds → different puzzles

#### CLI Tests
- ✓ Validate command (valid/invalid puzzles)
- ✓ Solve command (solvable/unsolvable)
- ✓ Generate command (all difficulty levels)
- ✓ Help flags
- ✓ Missing required options
- ✓ Invalid options

### Determinism Tests

**Critical**: Generator and solver must be deterministic.

```typescript
test('generator: same seed produces same puzzle', () => {
  const result1 = generatePuzzle({ difficulty: 'easy', seed: 42 });
  const result2 = generatePuzzle({ difficulty: 'easy', seed: 42 });
  
  const str1 = formatGrid(result1.puzzle);
  const str2 = formatGrid(result2.puzzle);
  
  assert.strictEqual(str1, str2, 'Same seed must produce identical puzzles');
});

test('solver: deterministic solution path', () => {
  const puzzle = /* ... */;
  const solution1 = solveGrid(puzzle);
  const solution2 = solveGrid(puzzle);
  
  assert.deepStrictEqual(solution1, solution2, 'Same puzzle must produce identical solution');
});
```

---

## Code Style and Conventions

### TypeScript

- **Strict mode**: Always enabled (`strict: true` in `tsconfig.json`)
- **Explicit types**: Prefer explicit return types on exported functions
- **No `any`**: Avoid `any`; use `unknown` if needed
- **Immutability**: Prefer `const` over `let`

### Naming

- **Files**: kebab-case (`parser.ts`, `grid-helpers.ts`)
- **Classes**: PascalCase (`ParseError`, `ValidationResult`)
- **Functions**: camelCase (`parseInput`, `validateGrid`)
- **Constants**: UPPER_SNAKE_CASE (`GRID_SIZE`, `TOTAL_CELLS`)
- **Types**: PascalCase (`Grid`, `CellValue`, `Difficulty`)

### Imports

- **ES Modules**: Use `.js` extensions in imports (TypeScript requirement)
  ```typescript
  import { parseInput } from './core/parser.js';  // ✓
  import { parseInput } from './core/parser';     // ✗
  ```

### Comments

- **JSDoc**: Use for public APIs
  ```typescript
  /**
   * Parse an 81-character puzzle string into a Grid.
   *
   * @param input - 81-character string (digits 1-9, 0, or .)
   * @returns Grid - 9×9 array of CellValue
   * @throws ParseError if input is invalid
   */
  export function parsePuzzleString(input: string): Grid {
    // ...
  }
  ```
- **Inline**: Use for complex logic
- **TODO**: Mark with `// TODO: description`

### Error Messages

- **User-facing**: Clear, actionable
  ```typescript
  console.error('Error: --input option is required');
  console.error(`Run 'sudoku ${command} --help' for usage information.`);
  ```
- **Developer-facing**: Include context
  ```typescript
  throw new ParseError(
    `Invalid puzzle length: expected ${TOTAL_CELLS} characters, got ${input.length}`,
    'INVALID_LENGTH'
  );
  ```

---

## Common Pitfalls

### 1. Breaking Determinism

**Problem**: Using `Math.random()` or non-deterministic operations.

**Solution**: Always use the seeded PRNG.

```typescript
// ✗ Wrong
const randomIndex = Math.floor(Math.random() * array.length);

// ✓ Correct
const random = createPrng(seed);
const randomIndex = Math.floor(random() * array.length);
```

---

### 2. Mutating Input Grids

**Problem**: Modifying the input `Grid` in place.

**Solution**: Clone the grid before modification.

```typescript
// ✗ Wrong
export function solveGrid(grid: Grid): SolveResult {
  // Modifies input!
  grid[0][0] = 5;
}

// ✓ Correct
export function solveGrid(grid: Grid): SolveResult {
  const workingGrid = grid.map(row => [...row]);
  workingGrid[0][0] = 5;
}
```

---

### 3. Inconsistent Empty Cell Representation

**Problem**: Mixing `0`, `'0'`, `'.'`, `null`, `undefined`.

**Solution**: Always use `0` (numeric zero) internally.

```typescript
// ✗ Wrong
if (grid[row][col] === '0' || grid[row][col] === '.') { }

// ✓ Correct
if (grid[row][col] === 0) { }
```

---

### 4. Off-by-One in Box Calculations

**Problem**: Incorrect box index calculation.

**Solution**: Use the standard formula.

```typescript
// ✓ Correct box index
const boxRow = Math.floor(row / 3);
const boxCol = Math.floor(col / 3);
const boxIndex = boxRow * 3 + boxCol;

// ✓ Correct box cell iteration
const boxStartRow = Math.floor(boxIndex / 3) * 3;
const boxStartCol = (boxIndex % 3) * 3;

for (let r = boxStartRow; r < boxStartRow + 3; r++) {
  for (let c = boxStartCol; c < boxStartCol + 3; c++) {
    // Process grid[r][c]
  }
}
```

---

### 5. Forgetting to Exit

**Problem**: Not calling `process.exit()` in command handlers.

**Solution**: Always call `process.exit(0)` or `process.exit(1)`.

```typescript
// ✗ Wrong
export async function runValidateCommand(args: string[]): Promise<void> {
  const result = validateGrid(grid);
  if (result.status === 'valid-complete') {
    console.log('Valid puzzle (complete)');
    // Missing process.exit(0)
  }
}

// ✓ Correct
export async function runValidateCommand(args: string[]): Promise<void> {
  const result = validateGrid(grid);
  if (result.status === 'valid-complete') {
    console.log('Valid puzzle (complete)');
    process.exit(0);  // Explicit exit
  }
}
```

---

## Development Workflow

### 1. Make Changes

Edit files in `src/`

### 2. Type Check

```bash
npm run typecheck
```

Fix any type errors before proceeding.

### 3. Build

```bash
npm run build
```

Compiles TypeScript → JavaScript in `dist/`

### 4. Test Manually

```bash
node dist/cli.js <command> [options]
# or
npm run cli -- <command> [options]
```

### 5. Run Tests

```bash
npm test
```

### 6. Fix Issues

Iterate on steps 1-5 until all tests pass.

### 7. Update Documentation

Update README, COMMANDS, ARCHITECTURE as needed.

---

## Debugging Tips

### Enable TypeScript Source Maps

Already enabled in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

### Debug with Node.js Inspector

```bash
node --inspect-brk dist/cli.js validate --input "..."
```

Then attach with Chrome DevTools or VS Code debugger.

### Add Debug Logging

```typescript
// Temporary debug logging
console.error('[DEBUG] Grid:', grid);
console.error('[DEBUG] Result:', result);
```

Use `console.error` to avoid mixing with command output (stdout).

### Test Individual Modules

```typescript
// test/debug.test.ts
import { test } from 'node:test';
import { parseInput } from '../src/core/parser.js';

test('debug: parse specific input', async () => {
  const grid = await parseInput("530070000...");
  console.log(grid);
});
```

Run with:
```bash
npm test -- test/debug.test.ts
```

---

## Summary

### Key Principles
1. **Type safety first** - Fix all type errors
2. **Determinism always** - No `Math.random()` in core logic
3. **Test everything** - Especially determinism and edge cases
4. **Clear errors** - Help users understand what went wrong
5. **Small changes** - Easier to review and debug

### Safe Areas to Modify
- ✓ Command handlers (add new commands)
- ✓ Difficulty levels (add new levels with tests)
- ✓ Output formats (add new formatters)
- ✓ Solver heuristics (improve performance)
- ✓ Tests (add more coverage)

### Danger Zones
- ⚠ Grid representation (breaks everything)
- ⚠ Core types (`CellValue`, `Grid`)
- ⚠ Determinism (breaks generator tests)
- ⚠ Public APIs (breaks external users)

### When in Doubt
- Read the existing code
- Check the tests
- Ask for clarification
- Make a small, reversible change first

---

**For more information, see:**
- [README.md](./README.md) - User guide and quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed system architecture
- [COMMANDS.md](./COMMANDS.md) - Complete command reference
- [BACKLOG_PACK.md](./BACKLOG_PACK.md) - Original requirements and planning

**Happy coding!** 🎉
