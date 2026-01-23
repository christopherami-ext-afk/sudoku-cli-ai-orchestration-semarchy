# Architecture

## Overview
This repo is a Node.js (>= 20) + TypeScript Sudoku CLI.

Data flow is intentionally simple and deterministic:

CLI (`src/cli.ts`) → command (`src/commands/*`) → parser/validator/solver/generator (`src/core/*`) → CLI output.

## Module responsibilities

- `src/types/grid.ts`
  - Core types (`Grid`, `CellValue`) and grid formatting helpers.

- `src/core/parser.ts`
  - Converts an 81-character puzzle string (digits + `0`/`.` for empties) into a `Grid`.
  - Can also load from a file path (first non-empty line).
  - Throws `ParseError` with a stable `code` for CLI handling.

- `src/core/validator.ts`
  - Pure validation: detects duplicates in rows/columns/boxes.
  - Deterministic issue ordering: rows → columns → boxes.

- `src/core/solver.ts`
  - Deterministic backtracking solver.
  - Always scans cells in a fixed order and tries digits `1..9` in ascending order.

- `src/core/prng.ts`
  - Seeded deterministic PRNG used by generator (no `Math.random` in generation path).

- `src/core/generator.ts`
  - Generates a solved grid deterministically from a seed (seeded permutations of a base solution).
  - Removes clues based on a difficulty heuristic.
  - Sanity checks: generated puzzle validates and is solvable.

- `src/commands/*.ts`
  - CLI glue: parse args, call core modules, print human-readable output, and set exit codes.

## Conventions

- Puzzle strings are always 81 characters.
  - Digits `1-9` are clues.
  - `0` and `.` are treated as empty.

- Determinism is a hard requirement:
  - Generator must use `src/core/prng.ts` and must not rely on `Math.random`.
  - Validator/solver must be pure/deterministic.

## Extension points (AI-readiness)

- Adding a new subcommand:
  - Create `src/commands/<name>.ts` exporting `run<Name>Command(args)`.
  - Wire it into `src/cli.ts`.
  - Add CLI smoke coverage in `test/cli.smoke.test.ts`.

- Changing the grid representation:
  - Treat `src/types/grid.ts` as the single source of truth.
  - Update parser/validator/solver/generator consistently and update fixtures/tests.

- Keeping tests stable:
  - Prefer fixtures for puzzles/solutions.
  - Smoke tests run `dist/cli.js` via `child_process` to validate real CLI behavior.
