# BACKLOG_PACK

---

## SUD-1: Scaffold TypeScript Sudoku CLI Repository & Command Framework

**Title**  
SUD-1: Scaffold TypeScript Sudoku CLI Repository & Command Framework

**Description**  
Create a Node.js (>= 20) + TypeScript project with a minimal but real CLI `sudoku` that exposes the subcommands `validate`, `solve`, and `generate`. No Sudoku logic yet—only project structure, build config, and command wiring.

---

### Acceptance Criteria

- Git repo initialized and first commit created.
- `package.json`:
  - Node engine: `>=20`.
  - NPM scripts: `build`, `start`/`cli`, `test` (placeholder).
  - `bin` field configured so `sudoku` can be run after build/install.
- `tsconfig.json`:
  - `strict: true`.
  - Outputs to `dist/`.
- CLI entrypoint (e.g., `src/cli.ts`) exists and:
  - Handles subcommands: `validate`, `solve`, `generate`.
  - Prints `--help` for root and each subcommand.
- `npm run build` completes successfully.
- `node dist/cli.js --help` (and `validate/solve/generate --help`) work.

---

### Definition of Done (DoD)

- Project builds cleanly with TypeScript, no type errors.
- CLI dispatching structure is stable and agreed (subcommand modules).
- No Sudoku domain logic implemented yet.
- `.gitignore` set up for `node_modules`, `dist`, etc.
- Changes committed and pushed to the remote repository.

---

### Implementation Notes (for AI assistant)

- Use structure like:
  - `src/cli.ts` – main argument parsing and subcommand dispatch.
  - `src/commands/validate.ts` – stub handler.
  - `src/commands/solve.ts` – stub handler.
  - `src/commands/generate.ts` – stub handler.
- Each subcommand file should export a function like `runValidateCommand(args)`.
- For now, handlers can just print “not implemented yet” but accept options that will be used later:
  - `validate/solve`: `--input`.
  - `generate`: `--difficulty`, `--seed`.
- Decide ESM vs CJS and keep consistent across config and imports.

---

### Files likely impacted

- `package.json`
- `tsconfig.json`
- `.gitignore`
- `src/cli.ts`
- `src/commands/validate.ts`
- `src/commands/solve.ts`
- `src/commands/generate.ts`
- (Optional minimal) `README.md`

---

### Commands to verify

```bash
npm install
npm run build

# root help
node dist/cli.js --help

# subcommand help
node dist/cli.js validate --help
node dist/cli.js solve --help
node dist/cli.js generate --help
```

If `bin` is configured:

```bash
npx sudoku --help
npx sudoku validate --help
npx sudoku solve --help
npx sudoku generate --help
```

---

### Guardrails

- Tests-first where practical (even if minimal smoke tests for CLI options).
- Prefer small, focused diffs (scaffolding only; no Sudoku logic).
- Keep generator CLI shape compatible with deterministic seed use later (`--seed` present).
- No UI (no HTTP server, no GUI; CLI only).
- Target Node >= 20 (engine field + TS target).

---

## SUD-2: Implement Robust Sudoku Input Parsing (81-Char String or File)

**Title**  
SUD-2: Implement Robust Sudoku Input Parsing (81-Char String or File)

**Description**  
Implement a shared parser that converts CLI `--input` into a 9x9 Sudoku grid. Support literal 81-char strings and file-based puzzles. Enforce length and character constraints (`1–9`, `0`, `.`) and return structured errors for the CLI.

---

### Acceptance Criteria

- A `Grid` type defined and reused (e.g., `number | 0` per cell, 9x9).
- Parser functions:
  - `parsePuzzleString(input: string): Grid`:
    - Requires length exactly 81.
    - Allowed chars: `1-9`, `0`, `.`.
    - Normalizes empties (`0`/`.`) to a single internal representation.
    - Returns `Grid` or throws/returns a typed `ParseError`.
  - `loadPuzzleFromFile(path: string): Promise<string>` or sync equivalent.
- File input:
  - First non-empty line is treated as puzzle string.
  - Clear errors for: file missing, unreadable, empty, bad content.
- CLI integration:
  - `validate`, `solve`, `generate` subcommands call shared helper:
    - Distinguish between literal and file path (simple rule or `--file` flag).
    - Non-zero exit code + human-readable message for parse or file errors.
- No Sudoku rule-checking/solving yet, just parsing.

---

### Definition of Done (DoD)

- Parser module and types compile and are imported by all subcommands.
- Manual runs confirm:
  - Valid 81-char strings are accepted.
  - Wrong length or invalid char strings are rejected with clear messages.
  - File-based inputs work and error cases are handled.
- CLI still returns “not implemented” after successful parse (until later stories).

---

### Implementation Notes (for AI assistant)

- Example `Grid`:

  ```ts
  export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  export type Grid = CellValue[][];
  ```

- Map index `i` to `(row, col)` as:
  - `row = Math.floor(i / 9)`
  - `col = i % 9`
- Create a `ParseError` class with `code` and `message` to simplify CLI error handling.
- Consider a helper like `resolveInputToString(arg: string, opts)` that encapsulates “string vs file” logic.

---

### Files likely impacted

- `src/types/grid.ts` (or similar, new)
- `src/core/parser.ts` (new)
- `src/commands/validate.ts` (now calls parser)
- `src/commands/solve.ts`
- `src/commands/generate.ts`
- (Later tests) `test/parser.test.ts`, `test/fixtures/*.txt`

---

### Commands to verify

```bash
npm run build

# Valid literal puzzle (81 chars)
node dist/cli.js validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"

# Invalid length
node dist/cli.js validate --input "123"
# Expect: non-zero exit, clear length error

# Invalid character
node dist/cli.js validate --input "x30070000600195000098000060800060003400803001700020006060000280000419005000080079"
# Expect: non-zero exit, clear char error

# File input (adjust syntax to your chosen approach)
node dist/cli.js validate --input ./examples/puzzle.txt
# or:
# node dist/cli.js validate --file ./examples/puzzle.txt
```

---

### Guardrails

- Tests-first for parsing rules (valid/invalid examples, file error paths).
- Small diffs: keep changes scoped to parsing + minimal CLI integration.
- Keep representation stable for later deterministic generator use.
- No UI; only CLI error messages.
- Node >= 20 (can use `fs/promises`, etc.).

---

## SUD-3: Implement Sudoku Validator and Wire `sudoku validate`

**Title**  
SUD-3: Implement Sudoku Validator and Wire `sudoku validate`

**Description**  
Add a validator that checks parsed grids for Sudoku rule consistency (rows, columns, boxes). Integrate it into `sudoku validate` to report whether the puzzle is valid and whether it is complete.

---

### Acceptance Criteria

- `validator` module exposes API like:

  ```ts
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

  function validateGrid(grid: Grid): ValidationResult;
  ```

- Rules:
  - Filled cells (`1–9`) only; empties ignored for duplicates.
  - No duplicates per row, per column, per 3x3 box.
  - All-empty => `valid-incomplete`.
  - Fully filled, no conflicts => `valid-complete`.
- `sudoku validate --input ...`:
  - Parses with SUD-2.
  - Calls `validateGrid`.
  - If `status` is `valid-complete` or `valid-incomplete`:
    - Exit code 0.
    - Output “Valid puzzle (complete/incomplete)”.
  - If `status` is `invalid`:
    - Non-zero exit code.
    - Output at least one clear issue (e.g., “duplicate 7 in row 2”).

---

### Definition of Done (DoD)

- `validateGrid` implemented and used by `sudoku validate`.
- Manual checks:
  - Valid/incomplete sample -> exit 0, correct message.
  - Valid/complete sample -> exit 0, correct message.
  - Invalid sample -> non-zero exit, clear explanation.
- No solver/generator code added in this story.

---

### Implementation Notes (for AI assistant)

- Helpers:

  ```ts
  getRow(grid, rowIndex);
  getColumn(grid, colIndex);
  getBox(grid, boxIndex); // boxIndex 0..8
  ```

- Derive `boxIndex` from `(row, col)` via:
  - `boxRow = Math.floor(row / 3)`
  - `boxCol = Math.floor(col / 3)`
  - `boxIndex = boxRow * 3 + boxCol`
- For each unit (row/column/box), count digit frequencies and record any count > 1 as an issue.
- Make issue ordering deterministic (e.g., rows first, then columns, then boxes).

---

### Files likely impacted

- `src/core/validator.ts` (new)
- `src/commands/validate.ts` (hook parser + validator + output)
- `src/types/grid.ts` (if helper types/constants needed)
- (Later tests) `test/validator.test.ts`, `test/fixtures/*.txt`

---

### Commands to verify

```bash
npm run build

# Valid incomplete puzzle
node dist/cli.js validate --input "<valid incomplete 81-char puzzle>"
# Expect: exit 0, message "Valid puzzle (incomplete)"

# Valid complete puzzle
node dist/cli.js validate --input "<valid complete 81-char solution>"
# Expect: exit 0, message "Valid puzzle (complete)"

# Invalid puzzle (e.g., duplicate in a row)
node dist/cli.js validate --input "<puzzle with deliberate row conflict>"
# Expect: non-zero exit, includes reason (e.g., "duplicate X in row Y")
```

---

### Guardrails

- Tests-first for `validateGrid` with fixtures (valid/invalid, row/column/box cases).
- Small diffs centered on validator + `validate` command only.
- Determinism: validator must be pure and non-random; important for generator tests later.
- No UI; textual CLI output only.
- Node >= 20 (no special APIs needed beyond standard TS/JS).

---

## SUD-4: Implement Sudoku Solver and Wire `sudoku solve`

**Title**  
SUD-4: Implement Sudoku Solver and Wire `sudoku solve`

**Description**  
Implement a deterministic Sudoku solver (e.g., backtracking) that either returns a complete valid solution or reports that the puzzle is unsolvable/invalid. Wire it into `sudoku solve` to output an 81-char solution or an error.

---

### Acceptance Criteria

- `solver` module exposes API like:

  ```ts
  interface SolveResult {
    solved: boolean;
    grid?: Grid;
    reason?: string; // "unsolvable" | "invalid" | ...
  }

  function solveGrid(grid: Grid): SolveResult;
  ```

- Behavior:
  - Uses current clues as fixed; does not alter them illegally.
  - For solvable puzzles:
    - Returns `solved: true` with full `Grid`.
    - Output grid passes `validateGrid`.
  - For unsolvable puzzles:
    - Returns `solved: false` with `reason = "unsolvable"` (or similar).
- `sudoku solve --input ...`:
  - Parses input (SUD-2).
  - Validates grid (SUD-3).
    - If invalid: print validation error, non-zero exit.
  - Calls solver:
    - On success: print solution as an 81-char string (`1–9` only), exit 0.
    - On failure: print “Puzzle is unsolvable” (or similar), non-zero exit.

---

### Definition of Done (DoD)

- `solveGrid` implemented and integrated into `sudoku solve`.
- Verified against at least one known puzzle/solution pair.
- Verified behavior for invalid and unsolvable puzzles.
- Types compile without errors; uses same `Grid` and validator helpers.

---

### Implementation Notes (for AI assistant)

- Use deterministic backtracking:
  - Always check cells in a fixed order (e.g., top-left to bottom-right).
  - Try digits 1..9 in ascending order.
- Optionally add a simple heuristic (e.g., choose cell with fewest candidates), but keep deterministic.
- Use fast constraint checks (direct row/col/box checks rather than full `validateGrid` on each step) to improve speed.
- Consider an internal flag or separate function later for “count solutions” (for generator).

---

### Files likely impacted

- `src/core/solver.ts` (new)
- `src/commands/solve.ts` (now parse + validate + solve + format)
- `src/core/validator.ts` (may add helper functions for solver’s use)
- (Later tests) `test/solver.test.ts`, `test/fixtures/*.txt`

---

### Commands to verify

```bash
npm run build

# Known solvable puzzle
node dist/cli.js solve --input "<known solvable puzzle>"
# Expect: exit 0 and an 81-char solution

# Invalid puzzle
node dist/cli.js solve --input "<puzzle with invalid row/col/box>"
# Expect: non-zero exit, validation error printed

# Structurally valid but unsolvable puzzle
node dist/cli.js solve --input "<unsolvable but structurally valid puzzle>"
# Expect: non-zero exit, "unsolvable" message
```

---

### Guardrails

- Tests-first with known puzzle/solution fixtures and unsolvable examples.
- Small diffs: limit to solver + `solve` command wiring.
- Solver must be deterministic (no randomness) to support deterministic generator & tests.
- No UI; solution printed as text only (81-char or optional ASCII grid via explicit flag).
- Node >= 20 target only.

---

## SUD-5: Implement Sudoku Generator with Difficulty Levels and Deterministic Seed

**Title**  
SUD-5: Implement Sudoku Generator with Difficulty Levels and Deterministic Seed

**Description**  
Add a Sudoku puzzle generator that creates valid, solvable puzzles for difficulty levels `easy`, `medium`, `hard` using a seeded deterministic PRNG. Integrate with `sudoku generate` so that same `--difficulty` + `--seed` ⇒ same puzzle.

---

### Acceptance Criteria

- `generator` module exposes something like:

  ```ts
  type Difficulty = 'easy' | 'medium' | 'hard';

  interface GenerateOptions {
    difficulty: Difficulty;
    seed: number;
  }

  interface GenerateResult {
    puzzle: Grid;   // with empties
    solution: Grid; // full solution
  }

  function generatePuzzle(opts: GenerateOptions): GenerateResult;
  ```

- Deterministic PRNG used (no `Math.random` in generation logic).
- Generation strategy:
  - Start from a valid solved grid (from solver or constructed).
  - Remove clues based on difficulty heuristics.
  - Ensure:
    - Resulting `puzzle` passes `validateGrid`.
    - `solveGrid` can solve it (at least one solution).
- Difficulty:
  - Defined heuristics for `easy`, `medium`, `hard` (documented in comments/README).
- `sudoku generate --difficulty <easy|medium|hard> --seed <number>`:
  - On success: exit 0 and print an 81-char puzzle (digits + `0` or `.`).
  - On invalid difficulty/seed: non-zero exit, clear error.
- Determinism:
  - Re-running the same command yields bit-identical puzzle output.

---

### Definition of Done (DoD)

- `generatePuzzle` implemented and used by `sudoku generate`.
- Manual check:
  - `easy/medium/hard` with `--seed 42` each produce stable results.
  - Generated puzzles validate and solve correctly via CLI.
- No type errors; generator reuses `Grid`, `validator`, `solver`.

---

### Implementation Notes (for AI assistant)

- Implement PRNG (e.g., LCG) in a helper:

  ```ts
  export function createPrng(seed: number): () => number { /* deterministic */ }
  ```

- Use PRNG for:
  - Creating variations of a solved grid (row/col swaps, box swaps).
  - Choosing which cells to clear.
- Difficulty heuristics (approximate but documented), e.g.:
  - `easy`: many clues, simple solving path.
  - `medium`: fewer clues.
  - `hard`: fewer clues + some constraints like symmetrical removal or minimal givens.
- Ensure you never rely on `Math.random` to decide puzzle structure.

---

### Files likely impacted

- `src/core/prng.ts` (new)
- `src/core/generator.ts` (new)
- `src/commands/generate.ts` (connect options, generator, and output formatting)
- `src/core/solver.ts` (used internally)
- `src/core/validator.ts` (used internally)
- (Later tests) `test/generator.test.ts`, `test/fixtures/*.txt`

---

### Commands to verify

```bash
npm run build

# Deterministic easy puzzle
node dist/cli.js generate --difficulty easy --seed 42
# Run twice; outputs must match exactly.

# Validate generated puzzle
node dist/cli.js generate --difficulty easy --seed 42 > /tmp/easy.txt
node dist/cli.js validate --input /tmp/easy.txt
# Expect: exit 0, valid & incomplete

# Solve generated puzzle
node dist/cli.js solve --input /tmp/easy.txt
# Expect: exit 0, solved

# Invalid difficulty
node dist/cli.js generate --difficulty insane --seed 42
# Expect: non-zero exit, clear error
```

---

### Guardrails

- Tests-first for generator determinism and validity/solvability of outputs.
- Small diffs focused on generator + PRNG + `generate` command.
- Deterministic generator with seed is mandatory (no `Math.random` in generation path).
- No UI; return puzzle as text only (81-char string).
- Node >= 20 target.

---

## SUD-6: Tests, CI Workflow, Documentation & AI-Readiness Assets

**Title**  
SUD-6: Add Tests, CI Workflow, Documentation, and AI-Readiness Assets

**Description**  
Implement unit tests and CLI smoke tests, set up CI to run build/typecheck/tests, and add documentation (README, architecture overview, command reference). Add AI-readiness docs so an AI coding assistant can quickly understand module responsibilities and safe extension points.

---

### Acceptance Criteria

- **Unit tests** (using `node:test` or lightweight runner):
  - Parser: valid/invalid strings, file errors.
  - Validator: valid/invalid, complete/incomplete, conflict cases.
  - Solver: known puzzles + solutions, unsolvable inputs.
  - Generator: determinism (same seed), validity + solvability of generated puzzles.
- **CLI smoke tests**:
  - Run built CLI via `child_process` or similar:
    - `validate` with valid and invalid puzzles.
    - `solve` on known puzzle.
    - `generate` with known seed and difficulty, then validate + solve.
- **NPM scripts**:
  - `"test"` runs all tests (unit + CLI smoke).
  - `"typecheck"` runs `tsc --noEmit` (or similar).
- **CI workflow** (e.g., GitHub Actions / Bitbucket Pipelines / GitLab CI):
  - Steps:
    - Checkout.
    - `npm ci`.
    - `npm run build`.
    - `npm run typecheck`.
    - `npm test`.
  - Fails on any type error or test failure.
- **Docs**:
  - `README.md`:
    - Overview, Node >= 20 requirement.
    - Install instructions.
    - CLI usage examples for `validate`, `solve`, `generate`.
    - Input format (81 chars, digits + `0`/`.`).
  - `ARCHITECTURE.md` or `docs/overview.md`:
    - High-level description of modules (parser, validator, solver, generator, CLI).
    - Data flow: CLI → parser → core → CLI.
  - `COMMANDS.md`:
    - Per-command options and examples.
- AI-readiness:
  - Docs describe file layout, entrypoints, and how to add/change commands and core logic safely.

---

### Definition of Done (DoD)

- `npm run build`, `npm run typecheck`, `npm test` pass locally.
- CI pipeline runs automatically on pushes/PRs and passes on main branch.
- Docs exist and match current implementation (no obvious drift).
- Example scripted demo flow documented:
  1. Validate valid puzzle.
  2. Validate invalid puzzle.
  3. Generate easy puzzle with `--seed 42`.
  4. Solve that generated puzzle.

---

### Implementation Notes (for AI assistant)

- Test layout suggestion:
  - `test/parser.test.ts`
  - `test/validator.test.ts`
  - `test/solver.test.ts`
  - `test/generator.test.ts`
  - `test/cli.smoke.test.ts`
- Use fixtures under `test/fixtures/` for:
  - Known puzzles + solutions.
  - Unsolvable puzzles.
  - Sample generator outputs.
- CI config files:
  - GitHub: `.github/workflows/ci.yml`
  - Bitbucket: `bitbucket-pipelines.yml`
  - etc., depending on hosting.
- In AI-readiness docs, explicitly list:
  - Main entrypoints (`src/cli.ts`).
  - Public APIs of `parser`, `validator`, `solver`, `generator`.
  - Conventions (grid format, error handling).

---

### Files likely impacted

- `package.json` (scripts)
- `test/*.test.ts`
- `test/fixtures/*`
- CI config (e.g., `.github/workflows/ci.yml` or equivalent)
- `README.md`
- `ARCHITECTURE.md` or `docs/overview.md`
- `COMMANDS.md`

---

### Commands to verify

```bash
npm run build
npm run typecheck
npm test
```

Optional manual/demo check:

```bash
node dist/cli.js generate --difficulty easy --seed 42 > /tmp/easy.txt
node dist/cli.js validate --input /tmp/easy.txt
node dist/cli.js solve --input /tmp/easy.txt
```

---

### Guardrails

- Tests-first: new behavior must be covered by tests; avoid untested logic.
- Small diffs: keep CI config, tests, and docs logically grouped to ease review.
- Generator tests must assert seed-based determinism (guard against regressions).
- No UI; all docs and tests assume CLI-only interface.
- CI must run on Node >= 20; typechecking and tests target Node 20 environment.

Sources:

