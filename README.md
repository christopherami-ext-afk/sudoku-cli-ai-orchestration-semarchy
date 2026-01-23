# Sudoku CLI

Node.js (>= 20) + TypeScript CLI for validating, solving, and generating Sudoku puzzles.

## Requirements

- Node.js >= 20
- npm

## Install

```bash
npm ci
```

## Build

```bash
npm run build
```

Run the CLI:

```bash
node dist/cli.js --help
```

## Puzzle input format

- 81 characters
- Digits `1-9` are filled cells
- `0` or `.` are empty cells

You can provide input either as:
- A literal 81-character string, or
- A file path (first non-empty line is used)

## Commands

### Validate

```bash
node dist/cli.js validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
```

### Solve

```bash
node dist/cli.js solve --input ./test/fixtures/solvable-puzzle.txt
```

### Generate (deterministic)

```bash
node dist/cli.js generate --difficulty easy --seed 42
```

Re-running with the same `--difficulty` and `--seed` produces identical output.

## Tests

Unit tests + CLI smoke tests:

```bash
npm test
```

Typecheck:

```bash
npm run typecheck
```

## Docs

- See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries and extension points.
- See [COMMANDS.md](COMMANDS.md) for the CLI reference.