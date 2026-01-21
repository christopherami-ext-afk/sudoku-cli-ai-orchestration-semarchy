# Architecture Overview

This document describes the high-level architecture of the Sudoku CLI application, module responsibilities, and data flow.

## Design Principles

1. **Separation of Concerns**: CLI, parsing, validation, solving, and generation are separate modules
2. **Type Safety**: Strict TypeScript with comprehensive type checking
3. **Determinism**: All operations are deterministic given the same inputs/seeds
4. **Error Handling**: Clear, structured errors with meaningful messages
5. **Testability**: Pure functions and isolated modules for easy testing

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLI Layer                          │
│                   (src/cli.ts)                          │
│  - Argument parsing                                     │
│  - Command dispatch                                     │
│  - Help text                                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  v
┌─────────────────────────────────────────────────────────┐
│                  Command Layer                          │
│              (src/commands/*.ts)                        │
│  - validate.ts: Validation command                      │
│  - solve.ts: Solving command                            │
│  - generate.ts: Generation command                      │
│  - Option parsing                                       │
│  - Result formatting                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  v
┌─────────────────────────────────────────────────────────┐
│                   Core Layer                            │
│               (src/core/*.ts)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ parser.ts                                        │  │
│  │ - String → Grid conversion                       │  │
│  │ - File loading                                   │  │
│  │ - Input validation                               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ validator.ts                                     │  │
│  │ - Rule checking (rows, columns, boxes)          │  │
│  │ - Completeness detection                         │  │
│  │ - Issue reporting                                │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ solver.ts                                        │  │
│  │ - Deterministic backtracking                     │  │
│  │ - Constraint propagation                         │  │
│  │ - Solution uniqueness checking (optional)        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ generator.ts                                     │  │
│  │ - Puzzle generation with difficulty              │  │
│  │ - Clue removal strategies                        │  │
│  │ - Uses solver and validator                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ prng.ts                                          │  │
│  │ - Seeded pseudo-random number generator          │  │
│  │ - Deterministic randomness                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  v
┌─────────────────────────────────────────────────────────┐
│                   Type Layer                            │
│              (src/types/*.ts)                           │
│  - Grid: 9x9 CellValue matrix                          │
│  - CellValue: 0 | 1 | 2 | ... | 9                      │
│  - Constants: GRID_SIZE, BOX_SIZE, etc.                │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Validate Command Flow

```
User Input
    │
    v
CLI (cli.ts)
    │
    v
validate.ts
    │
    ├─> parser.ts ──> parseInput() ──> Grid
    │                     │
    │                     v (on error)
    │                 ParseError ──> Exit 1
    │
    v
validator.ts ──> validateGrid(grid) ──> ValidationResult
    │
    ├─> status: 'valid-complete'    ──> "Valid puzzle (complete)"   ──> Exit 0
    ├─> status: 'valid-incomplete'  ──> "Valid puzzle (incomplete)" ──> Exit 0
    └─> status: 'invalid'           ──> "Invalid puzzle: ..."       ──> Exit 1
```

### Solve Command Flow

```
User Input
    │
    v
CLI (cli.ts)
    │
    v
solve.ts
    │
    ├─> parser.ts ──> parseInput() ──> Grid
    │                     │
    │                     v (on error)
    │                 ParseError ──> Exit 1
    │
    ├─> validator.ts ──> validateGrid(grid) ──> ValidationResult
    │                           │
    │                           v (if invalid)
    │                       ValidationError ──> Exit 1
    │
    v
solver.ts ──> solveGrid(grid) ──> SolveResult
    │
    ├─> solved: true   ──> formatGrid() ──> "81-char solution" ──> Exit 0
    └─> solved: false  ──> "Puzzle is unsolvable"              ──> Exit 1
```

### Generate Command Flow

```
User Input (--difficulty, --seed)
    │
    v
CLI (cli.ts)
    │
    v
generate.ts
    │
    ├─> Validate difficulty ∈ {easy, medium, hard}
    ├─> Validate seed is numeric
    │
    v
generator.ts
    │
    ├─> prng.ts ──> createPrng(seed) ──> Deterministic RNG
    │
    ├─> Create filled grid (using solver or pattern)
    │
    ├─> Remove clues based on difficulty
    │       │
    │       ├─> validator.ts (check validity)
    │       └─> solver.ts (ensure solvability)
    │
    v
GenerateResult { puzzle, solution }
    │
    v
formatGrid(puzzle) ──> "81-char puzzle" ──> Exit 0
```

## Module Responsibilities

### CLI Layer (`src/cli.ts`)

**Purpose**: Main entrypoint for the CLI application.

**Responsibilities**:
- Parse command-line arguments
- Dispatch to appropriate command handler
- Display help text
- Handle top-level errors

**Dependencies**: Command handlers (validate, solve, generate)

**Exports**: None (executable entry point)

---

### Command Layer (`src/commands/*.ts`)

**Purpose**: Handle command-specific logic and user interaction.

#### `validate.ts`

**Responsibilities**:
- Parse `--input` option
- Call parser to get Grid
- Call validator to check rules
- Format and display validation results
- Set appropriate exit codes

**Dependencies**: `parser`, `validator`

#### `solve.ts`

**Responsibilities**:
- Parse `--input` option
- Call parser to get Grid
- Validate grid before solving
- Call solver to get solution
- Format and display solution
- Set appropriate exit codes

**Dependencies**: `parser`, `validator`, `solver`

#### `generate.ts`

**Responsibilities**:
- Parse `--difficulty` and `--seed` options
- Validate option values
- Call generator to create puzzle
- Format and display generated puzzle
- Set appropriate exit codes

**Dependencies**: `generator`, `parser` (for formatGrid)

---

### Core Layer (`src/core/*.ts`)

#### `parser.ts`

**Purpose**: Convert user input into internal Grid representation.

**Responsibilities**:
- Parse 81-character puzzle strings
- Load puzzles from files
- Validate input format (length, characters)
- Convert between string and Grid representations
- Provide clear error messages

**Key Functions**:
- `parsePuzzleString(input: string): Grid`
- `loadPuzzleFromFile(path: string): Promise<string>`
- `parseInput(input: string): Promise<Grid>`
- `formatGrid(grid: Grid, useZero?: boolean): string`

**Error Handling**: Throws `ParseError` with specific error codes

**Dependencies**: `types/grid`, Node.js `fs/promises`

---

#### `validator.ts`

**Purpose**: Check Sudoku rule compliance.

**Responsibilities**:
- Validate rows (no duplicate digits)
- Validate columns (no duplicate digits)
- Validate 3×3 boxes (no duplicate digits)
- Detect puzzle completeness
- Report specific rule violations

**Key Functions**:
- `validateGrid(grid: Grid): ValidationResult`
- Helper functions: `getRow`, `getColumn`, `getBox`

**Types**:
```typescript
type ValidationStatus = 'valid-complete' | 'valid-incomplete' | 'invalid';

interface ValidationIssue {
  type: 'row' | 'column' | 'box';
  index: number; // 0-based
  value: number;
}

interface ValidationResult {
  status: ValidationStatus;
  issues: ValidationIssue[];
}
```

**Dependencies**: `types/grid`

---

#### `solver.ts`

**Purpose**: Solve Sudoku puzzles using backtracking.

**Responsibilities**:
- Solve valid Sudoku puzzles
- Use deterministic algorithm (consistent solving path)
- Detect unsolvable puzzles
- Optionally count solutions for generation

**Algorithm**: Deterministic backtracking
- Choose empty cells in fixed order (row-major)
- Try digits 1-9 in ascending order
- Fast constraint checking (avoid full grid validation)

**Key Functions**:
- `solveGrid(grid: Grid): SolveResult`
- Internal: `isValidPlacement`, `findEmptyCell`, `backtrack`

**Types**:
```typescript
interface SolveResult {
  solved: boolean;
  grid?: Grid;
  reason?: string;
}
```

**Dependencies**: `types/grid`, `validator` (for helpers)

---

#### `generator.ts`

**Purpose**: Generate valid, solvable Sudoku puzzles.

**Responsibilities**:
- Create puzzles at specified difficulty levels
- Use deterministic PRNG for reproducibility
- Remove clues based on difficulty heuristics
- Ensure puzzle validity and solvability

**Difficulty Heuristics**:
- **Easy**: More clues (40-45), simple solving techniques
- **Medium**: Fewer clues (30-35), moderate complexity
- **Hard**: Minimal clues (25-30), advanced techniques required

**Key Functions**:
- `generatePuzzle(opts: GenerateOptions): GenerateResult`
- Internal: `createFilledGrid`, `removeClues`, `checkDifficulty`

**Types**:
```typescript
type Difficulty = 'easy' | 'medium' | 'hard';

interface GenerateOptions {
  difficulty: Difficulty;
  seed: number;
}

interface GenerateResult {
  puzzle: Grid;   // with empties
  solution: Grid; // complete solution
}
```

**Dependencies**: `types/grid`, `solver`, `validator`, `prng`

---

#### `prng.ts`

**Purpose**: Provide deterministic pseudo-random number generation.

**Responsibilities**:
- Implement seeded RNG (e.g., Linear Congruential Generator)
- Guarantee same seed → same sequence
- Replace `Math.random()` for determinism

**Key Functions**:
- `createPrng(seed: number): () => number`
- Returns a function that generates deterministic random values

**Algorithm**: Linear Congruential Generator (LCG)
```
X(n+1) = (a * X(n) + c) mod m
```

**Dependencies**: None (pure math)

---

### Type Layer (`src/types/grid.ts`)

**Purpose**: Define core data structures and constants.

**Exports**:
```typescript
type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Grid = CellValue[][];

const GRID_SIZE = 9;
const BOX_SIZE = 3;
const TOTAL_CELLS = 81;
```

**Grid Representation**:
- `Grid[row][col]` accesses a cell
- `0` represents empty cells
- `1-9` represent filled cells
- Row-major indexing (row 0-8, col 0-8)

**Box Indexing**:
```
Box layout:
┌───┬───┬───┐
│ 0 │ 1 │ 2 │
├───┼───┼───┤
│ 3 │ 4 │ 5 │
├───┼───┼───┤
│ 6 │ 7 │ 8 │
└───┴───┴───┘

Box index calculation:
boxRow = floor(row / 3)
boxCol = floor(col / 3)
boxIndex = boxRow * 3 + boxCol
```

---

## Error Handling Strategy

### ParseError
- Thrown by `parser.ts`
- Includes error `code` and human-readable `message`
- Caught by command handlers → non-zero exit

### Validation Errors
- Returned as `ValidationResult` (not thrown)
- Status + detailed issues list
- Commands check status and format output

### Solve Failures
- Returned as `SolveResult` with `solved: false`
- Includes `reason` (e.g., "unsolvable", "invalid")
- Not treated as exceptions (expected behavior)

### General Errors
- Unexpected errors caught at CLI level
- Logged with `console.error`
- Exit code 1

---

## Testing Strategy

### Unit Tests
- **Parser**: Valid/invalid strings, file errors, format conversion
- **Validator**: All rule types (row, column, box), completeness
- **Solver**: Known puzzles, unsolvable cases, determinism
- **Generator**: Seed-based determinism, validity, solvability
- **PRNG**: Deterministic sequence generation

### Integration Tests
- CLI smoke tests via `child_process`
- Full command flows (parse → validate → solve)
- File input scenarios

### Determinism Tests
- Generator: Same seed → same puzzle
- Solver: Same puzzle → same solution
- Critical for reproducibility

---

## Extension Points

### Adding a New Command

1. Create `src/commands/newcommand.ts`
2. Export `runNewCommand(args: string[]): Promise<void>`
3. Add case in `src/cli.ts` switch statement
4. Update help text in `cli.ts`
5. Add tests in `test/newcommand.test.ts`

### Adding a New Difficulty Level

1. Update `Difficulty` type in `src/core/generator.ts`
2. Add heuristics in `removeClues` function
3. Update command validation in `src/commands/generate.ts`
4. Update documentation

### Extending Validator

1. Add new issue types to `ValidationIssue`
2. Implement check in `validateGrid`
3. Add tests for new validation rules
4. Update command output formatting

---

## Performance Considerations

### Solver Optimization
- Fast constraint checking (avoid full grid scan)
- Early termination on unsolvable branches
- Consider adding heuristics (MRV, forward checking) if needed

### Generator Optimization
- Reuse solved grids when possible
- Cache validation results during clue removal
- Consider parallel generation (with different seeds)

### File I/O
- Minimal file reads (single read per file)
- Stream-based reading for large files (future)

---

## Build and Deployment

### Build Process
```bash
npm run build
# Compiles TypeScript → dist/
# Preserves ESM module format
```

### Type Checking
```bash
npm run typecheck
# Validates types without emitting files
```

### Testing
```bash
npm test
# Builds code
# Compiles tests
# Runs Node.js test runner
```

### Distribution
- Binary: `dist/cli.js` with shebang
- NPM package: `bin` field points to `dist/cli.js`
- Can be run via `npx sudoku` after install

---

## Dependencies

### Production
- None (pure Node.js >= 20)

### Development
- TypeScript >= 5.0
- @types/node >= 20.0

---

## Future Enhancements

- **Batch Mode**: Process multiple puzzles from a file
- **Output Formats**: JSON, CSV, visual grid
- **Advanced Solver**: Techniques beyond backtracking
- **Hints**: Provide solving hints instead of full solution
- **Statistics**: Puzzle difficulty analysis
- **Web API**: HTTP server wrapping core logic
- **Performance Metrics**: Timing and statistics

---

## References

- [BACKLOG_PACK.md](./BACKLOG_PACK.md) - Original requirements and stories
- [README.md](./README.md) - User-facing documentation
- [COMMANDS.md](./COMMANDS.md) - Detailed command reference
- [docs/AI_READINESS.md](./docs/AI_READINESS.md) - AI assistant guide
