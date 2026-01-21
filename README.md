# Sudoku CLI

A robust command-line tool for validating, solving, and generating Sudoku puzzles, built with TypeScript and Node.js.

## Features

- **Validate** Sudoku puzzles (checks for rule violations)
- **Solve** Sudoku puzzles using deterministic backtracking
- **Generate** puzzles with configurable difficulty and deterministic seeding
- Support for both literal puzzle strings and file input
- Strict rule validation (no duplicates in rows, columns, or 3×3 boxes)
- Deterministic generation: same seed + difficulty = same puzzle

## Requirements

- **Node.js** >= 20

## Installation

```bash
npm install
npm run build
```

After building, you can run the CLI with:

```bash
npx sudoku <command> [options]
# or
node dist/cli.js <command> [options]
```

## Quick Start

```bash
# Generate a puzzle with seed 42
npx sudoku generate --difficulty easy --seed 42

# Validate a puzzle
npx sudoku validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"

# Solve a puzzle
npx sudoku solve --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
```

## Input Format

Sudoku puzzles are represented as **81-character strings**:
- Digits `1-9` represent filled cells
- `0` or `.` represent empty cells
- Characters are read left-to-right, top-to-bottom

**Example:**
```
530070000600195000098000060800060003400803001700020006060000280000419005000080079
```

This represents:
```
5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9
```

## Commands

### `validate`

Validate whether a Sudoku puzzle follows the rules.

```bash
npx sudoku validate --input <puzzle>
```

**Options:**
- `--input <puzzle>`: 81-character string or path to file

**Examples:**
```bash
# Validate a literal puzzle string
npx sudoku validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"

# Validate from a file
npx sudoku validate --input ./examples/puzzle.txt
```

**Exit Codes:**
- `0`: Valid puzzle (complete or incomplete)
- `1`: Invalid puzzle or parse error

**Output:**
- Valid: `"Valid puzzle (complete)"` or `"Valid puzzle (incomplete)"`
- Invalid: Lists all rule violations (e.g., "Duplicate 5 in row 3")

---

### `solve`

Solve a Sudoku puzzle and output the solution.

```bash
npx sudoku solve --input <puzzle>
```

**Options:**
- `--input <puzzle>`: 81-character string or path to file

**Examples:**
```bash
# Solve a literal puzzle string
npx sudoku solve --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"

# Solve from a file
npx sudoku solve --input ./examples/puzzle.txt
```

**Exit Codes:**
- `0`: Puzzle solved successfully
- `1`: Puzzle is invalid or unsolvable

**Output:**
- Success: 81-character solution string (all digits `1-9`)
- Failure: Error message explaining why the puzzle couldn't be solved

---

### `generate`

Generate a new Sudoku puzzle with specified difficulty and seed.

```bash
npx sudoku generate --difficulty <level> --seed <number>
```

**Options:**
- `--difficulty <level>`: Difficulty level (`easy`, `medium`, or `hard`)
- `--seed <number>`: Random seed for deterministic generation

**Examples:**
```bash
# Generate an easy puzzle with seed 42
npx sudoku generate --difficulty easy --seed 42

# Generate a hard puzzle with seed 99
npx sudoku generate --difficulty hard --seed 99
```

**Exit Codes:**
- `0`: Puzzle generated successfully
- `1`: Invalid difficulty or seed

**Output:**
- Success: 81-character puzzle string with empty cells as `0`

**Determinism:** Running the same command with the same `--difficulty` and `--seed` will always produce the exact same puzzle.

---

## Demo Workflow

Here's a complete workflow demonstrating all commands:

```bash
# 1. Validate a known valid puzzle
npx sudoku validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
# Output: Valid puzzle (incomplete)

# 2. Try to validate an invalid puzzle (duplicate 5 in first row)
npx sudoku validate --input "553070000600195000098000060800060003400803001700020006060000280000419005000080079"
# Output: Invalid puzzle:
#   - Duplicate 5 in row 1
# Exit code: 1

# 3. Generate an easy puzzle with seed 42
npx sudoku generate --difficulty easy --seed 42 > /tmp/generated.txt
# Output: (81-character puzzle saved to file)

# 4. Validate the generated puzzle
npx sudoku validate --input /tmp/generated.txt
# Output: Valid puzzle (incomplete)

# 5. Solve the generated puzzle
npx sudoku solve --input /tmp/generated.txt
# Output: (81-character solution)
```

## Development

### Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Type Check

```bash
npm run typecheck
```

Runs TypeScript compiler in type-check mode (no output).

### Run Tests

```bash
npm test
```

Runs all unit tests and CLI smoke tests.

### Project Structure

```
src/
├── cli.ts              # Main CLI entrypoint
├── commands/           # Command handlers
│   ├── validate.ts
│   ├── solve.ts
│   └── generate.ts
├── core/               # Core Sudoku logic
│   ├── parser.ts       # Input parsing
│   ├── validator.ts    # Rule validation
│   ├── solver.ts       # Puzzle solving
│   ├── generator.ts    # Puzzle generation
│   └── prng.ts         # Deterministic PRNG
└── types/
    └── grid.ts         # Type definitions
```

## Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design and module responsibilities
- [Command Reference](./COMMANDS.md) - Detailed command documentation
- [AI-Readiness Guide](./docs/AI_READINESS.md) - Guide for AI assistants and contributors

## Implementation History

This project was built incrementally following the backlog in [BACKLOG_PACK.md](./BACKLOG_PACK.md):

1. **SUD-1**: CLI scaffolding and command framework
2. **SUD-2**: Robust input parsing (strings and files)
3. **SUD-3**: Sudoku validator implementation
4. **SUD-4**: Sudoku solver (deterministic backtracking)
5. **SUD-5**: Puzzle generator with difficulty levels and seeding
6. **SUD-6**: Tests, CI, and documentation (current)

## License

ISC