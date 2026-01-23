# Command Reference

All commands are executed via the built CLI:

- `node dist/cli.js <command> [options]`

Input puzzles can be either:
- An 81-character string (`1-9` digits and `0` or `.` as empty), OR
- A file path where the first non-empty line is the puzzle string.

## `validate`

Validate a Sudoku puzzle for rule consistency.

- Usage: `sudoku validate --input <puzzleOrPath>`
- Exit codes:
  - `0`: valid puzzle (complete or incomplete)
  - `1`: parse error or invalid puzzle

Example:
- `node dist/cli.js validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"`

## `solve`

Solve a Sudoku puzzle.

- Usage: `sudoku solve --input <puzzleOrPath>`
- Output:
  - On success: prints an 81-character solution string (digits only)
- Exit codes:
  - `0`: solved
  - `1`: parse error, invalid puzzle, or unsolvable puzzle

Example:
- `node dist/cli.js solve --input ./test/fixtures/solvable-puzzle.txt`

## `generate`

Generate a deterministic Sudoku puzzle from a seed.

- Usage: `sudoku generate --difficulty <easy|medium|hard> --seed <number>`
- Output:
  - On success: prints an 81-character puzzle string (digits + `0` empties)
- Exit codes:
  - `0`: generated
  - `1`: invalid args or internal error

Example:
- `node dist/cli.js generate --difficulty easy --seed 42`
