# Command Reference

Complete reference documentation for all Sudoku CLI commands.

## Table of Contents

- [Global Options](#global-options)
- [validate](#validate)
- [solve](#solve)
- [generate](#generate)
- [Exit Codes](#exit-codes)
- [Input Format](#input-format)
- [Examples](#examples)

---

## Global Options

These options work with the root `sudoku` command:

```bash
sudoku --help
sudoku -h
```

**Description**: Display general help information and list available commands.

---

## validate

Validate whether a Sudoku puzzle follows the game rules.

### Synopsis

```bash
sudoku validate --input <puzzle>
sudoku validate --help
```

### Description

Checks if a Sudoku puzzle is valid according to the standard rules:
- No duplicate digits (1-9) in any row
- No duplicate digits (1-9) in any column
- No duplicate digits (1-9) in any 3×3 box

Empty cells (represented as `0` or `.`) are ignored during validation.

The command reports whether the puzzle is:
- **Valid and complete**: All cells filled, no rule violations
- **Valid and incomplete**: Some empty cells, no rule violations
- **Invalid**: One or more rule violations

### Options

#### `--input <puzzle>` (required)

The Sudoku puzzle to validate. Can be:
- An 81-character string (digits 1-9, 0, or `.`)
- A path to a file containing the puzzle

**Examples:**
```bash
--input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
--input ./examples/puzzle.txt
--input /tmp/generated.txt
```

#### `--help`, `-h`

Display help information for the validate command.

### Exit Codes

- **0**: Puzzle is valid (complete or incomplete)
- **1**: Puzzle is invalid, parse error, or missing required option

### Output

#### Valid Complete Puzzle
```bash
$ sudoku validate --input "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
Valid puzzle (complete)
```

#### Valid Incomplete Puzzle
```bash
$ sudoku validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
Valid puzzle (incomplete)
```

#### Invalid Puzzle
```bash
$ sudoku validate --input "553070000600195000098000060800060003400803001700020006060000280000419005000080079"
Invalid puzzle:
  - Duplicate 5 in row 1
```

Multiple violations will all be listed:
```bash
Invalid puzzle:
  - Duplicate 5 in row 1
  - Duplicate 3 in column 2
  - Duplicate 7 in box 5
```

### Error Messages

#### Missing Input
```bash
$ sudoku validate
Error: --input option is required
Run 'sudoku validate --help' for usage information.
```

#### Invalid Length
```bash
$ sudoku validate --input "123"
Parse error: Invalid puzzle length: expected 81 characters, got 3
```

#### Invalid Character
```bash
$ sudoku validate --input "x30070000600195000098000060800060003400803001700020006060000280000419005000080079"
Parse error: Invalid character in puzzle: 'x'. Only digits 1-9, 0, and . are allowed
```

#### File Not Found
```bash
$ sudoku validate --input ./missing.txt
Parse error: File not found or not readable: ./missing.txt
```

### Examples

```bash
# Validate a valid incomplete puzzle
sudoku validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"

# Validate from a file
sudoku validate --input ./examples/puzzle.txt

# Validate a complete solution
sudoku validate --input "534678912672195348198342567859761423426853791713924856961537284287419635345286179"

# Try to validate an invalid puzzle (duplicate in row)
sudoku validate --input "553070000600195000098000060800060003400803001700020006060000280000419005000080079"
```

---

## solve

Solve a Sudoku puzzle and output the solution.

### Synopsis

```bash
sudoku solve --input <puzzle>
sudoku solve --help
```

### Description

Solves a Sudoku puzzle using a deterministic backtracking algorithm. The puzzle must be valid (pass all Sudoku rules) to be solved.

The solver:
- Uses a deterministic algorithm (same puzzle → same solution path)
- Finds exactly one solution (does not enumerate all solutions)
- Detects unsolvable puzzles
- Validates the puzzle before attempting to solve

### Options

#### `--input <puzzle>` (required)

The Sudoku puzzle to solve. Can be:
- An 81-character string (digits 1-9, 0, or `.`)
- A path to a file containing the puzzle

**Examples:**
```bash
--input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
--input ./examples/puzzle.txt
```

#### `--help`, `-h`

Display help information for the solve command.

### Exit Codes

- **0**: Puzzle solved successfully
- **1**: Puzzle is invalid, unsolvable, or parse error

### Output

#### Successful Solution
```bash
$ sudoku solve --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
534678912672195348198342567859761423426853791713924856961537284287419635345286179
```

The output is an 81-character string representing the complete solution (all digits 1-9).

#### Invalid Puzzle
```bash
$ sudoku solve --input "553070000600195000098000060800060003400803001700020006060000280000419005000080079"
Invalid puzzle:
  - Duplicate 5 in row 1
```

#### Unsolvable Puzzle
```bash
$ sudoku solve --input "516849732307605000809700065135060907472591006968370050253186074684207500791050608"
Puzzle is unsolvable
```

### Error Messages

Same parse errors as the `validate` command:
- Missing `--input` option
- Invalid puzzle length
- Invalid characters
- File not found

### Examples

```bash
# Solve a standard puzzle
sudoku solve --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"

# Solve from a file
sudoku solve --input ./examples/puzzle.txt

# Solve and save to file
sudoku solve --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079" > solution.txt

# Pipe generated puzzle to solver
sudoku generate --difficulty easy --seed 42 | xargs -I {} sudoku solve --input {}
```

---

## generate

Generate a new Sudoku puzzle with specified difficulty and seed.

### Synopsis

```bash
sudoku generate --difficulty <level> --seed <number>
sudoku generate --help
```

### Description

Generates a valid, solvable Sudoku puzzle using a deterministic algorithm. The same combination of difficulty level and seed will always produce the exact same puzzle.

This determinism is crucial for:
- Reproducible testing
- Sharing specific puzzles
- Debugging
- Consistent user experiences

### Options

#### `--difficulty <level>` (required)

The difficulty level of the puzzle. Must be one of:
- `easy`: More clues (40-45), straightforward solving path
- `medium`: Moderate clues (30-35), some advanced techniques
- `hard`: Fewer clues (25-30), requires advanced techniques

**Examples:**
```bash
--difficulty easy
--difficulty medium
--difficulty hard
```

#### `--seed <number>` (required)

A numeric seed for the deterministic random number generator. Any integer is valid.

The same seed with the same difficulty will always produce the same puzzle.

**Examples:**
```bash
--seed 42
--seed 12345
--seed 0
--seed -999
```

#### `--help`, `-h`

Display help information for the generate command.

### Exit Codes

- **0**: Puzzle generated successfully
- **1**: Invalid difficulty, invalid seed, or generation error

### Output

#### Successful Generation
```bash
$ sudoku generate --difficulty easy --seed 42
007800000490020070000107200074000800060000040003000610008506000030090056000003700
```

The output is an 81-character string representing the puzzle with empty cells as `0`.

### Error Messages

#### Missing Options
```bash
$ sudoku generate --difficulty easy
Error: --seed option is required
Run 'sudoku generate --help' for usage information.
```

```bash
$ sudoku generate --seed 42
Error: --difficulty option is required
Run 'sudoku generate --help' for usage information.
```

#### Invalid Difficulty
```bash
$ sudoku generate --difficulty insane --seed 42
Error: Invalid difficulty 'insane'. Must be 'easy', 'medium', or 'hard'
```

#### Invalid Seed
```bash
$ sudoku generate --difficulty easy --seed abc
Error: Invalid seed 'abc'. Must be a number
```

### Determinism

The generator guarantees that the same inputs produce the same output:

```bash
# Generate puzzle twice with same parameters
$ sudoku generate --difficulty easy --seed 42
007800000490020070000107200074000800060000040003000610008506000030090056000003700

$ sudoku generate --difficulty easy --seed 42
007800000490020070000107200074000800060000040003000610008506000030090056000003700

# Different seed produces different puzzle
$ sudoku generate --difficulty easy --seed 43
000009100300400000009001040000500074570000036430008000080200300000004002004700000
```

### Examples

```bash
# Generate an easy puzzle
sudoku generate --difficulty easy --seed 42

# Generate a hard puzzle
sudoku generate --difficulty hard --seed 99

# Generate and validate
sudoku generate --difficulty medium --seed 100 > /tmp/puzzle.txt
sudoku validate --input /tmp/puzzle.txt

# Generate and solve
sudoku generate --difficulty easy --seed 42 > /tmp/puzzle.txt
sudoku solve --input /tmp/puzzle.txt

# Generate multiple puzzles with different seeds
for i in {1..5}; do
  sudoku generate --difficulty easy --seed $i > puzzle_$i.txt
done
```

---

## Exit Codes

All commands use consistent exit codes:

| Code | Meaning |
|------|---------|
| 0    | Success - command completed as expected |
| 1    | Error - invalid input, parse error, rule violation, or unsolvable puzzle |

### Examples

```bash
# Check exit code in bash
sudoku validate --input "valid_puzzle_string"
echo $?  # prints 0

sudoku validate --input "invalid_puzzle_string"
echo $?  # prints 1

# Use in scripts
if sudoku validate --input "$PUZZLE"; then
  echo "Puzzle is valid"
else
  echo "Puzzle is invalid"
fi
```

---

## Input Format

### 81-Character String Format

Sudoku puzzles are represented as a single string of 81 characters, read left-to-right, top-to-bottom.

#### Character Set
- `1-9`: Filled cells (clues or solution values)
- `0` or `.`: Empty cells (unknowns)

#### Example

String:
```
530070000600195000098000060800060003400803001700020006060000280000419005000080079
```

Represents this grid:
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

#### Position Mapping

String index `i` maps to grid position `(row, col)`:
- `row = floor(i / 9)` (0-8)
- `col = i % 9` (0-8)

Examples:
- Index 0 → (0, 0) = top-left cell
- Index 4 → (0, 4) = row 0, column 4
- Index 40 → (4, 4) = center cell
- Index 80 → (8, 8) = bottom-right cell

### File Format

Files should contain the 81-character puzzle string on the first non-empty line.

#### Example File (`puzzle.txt`)
```
530070000600195000098000060800060003400803001700020006060000280000419005000080079
```

Or with comments/blank lines:
```
# Easy Sudoku puzzle
# Generated with seed 42

530070000600195000098000060800060003400803001700020006060000280000419005000080079
```

The parser reads the first non-empty, non-whitespace line.

#### Using Files

```bash
# All commands support file input
sudoku validate --input ./puzzle.txt
sudoku solve --input ./puzzle.txt

# Save generated puzzle to file
sudoku generate --difficulty easy --seed 42 > puzzle.txt
```

---

## Examples

### Complete Workflow

```bash
# 1. Generate a puzzle
sudoku generate --difficulty easy --seed 42 > puzzle.txt

# 2. Validate it's correct
sudoku validate --input puzzle.txt
# Output: Valid puzzle (incomplete)

# 3. Solve the puzzle
sudoku solve --input puzzle.txt > solution.txt

# 4. Verify the solution is complete
sudoku validate --input solution.txt
# Output: Valid puzzle (complete)

# 5. Compare puzzle and solution
echo "Puzzle:  $(cat puzzle.txt)"
echo "Solution: $(cat solution.txt)"
```

### Batch Processing

```bash
# Generate 10 puzzles
for seed in {1..10}; do
  sudoku generate --difficulty medium --seed $seed > puzzles/puzzle_$seed.txt
done

# Validate all puzzles
for file in puzzles/*.txt; do
  if sudoku validate --input "$file"; then
    echo "✓ $file is valid"
  else
    echo "✗ $file is invalid"
  fi
done

# Solve all puzzles
for file in puzzles/puzzle_*.txt; do
  solution_file="${file/puzzle/solution}"
  sudoku solve --input "$file" > "$solution_file"
done
```

### Error Handling in Scripts

```bash
#!/bin/bash

PUZZLE="530070000600195000098000060800060003400803001700020006060000280000419005000080079"

# Attempt to solve
if SOLUTION=$(sudoku solve --input "$PUZZLE" 2>&1); then
  echo "Solution found: $SOLUTION"
  
  # Verify solution is valid
  if sudoku validate --input "$SOLUTION" > /dev/null 2>&1; then
    echo "Solution is valid!"
  else
    echo "WARNING: Solution is invalid!"
    exit 1
  fi
else
  echo "Failed to solve: $SOLUTION"
  exit 1
fi
```

### Testing Determinism

```bash
# Generate same puzzle multiple times
for i in {1..5}; do
  sudoku generate --difficulty easy --seed 42
done | sort -u | wc -l
# Output: 1 (all puzzles identical)

# Different seeds produce different puzzles
for seed in {1..5}; do
  sudoku generate --difficulty easy --seed $seed
done | sort -u | wc -l
# Output: 5 (all puzzles unique)
```

### Performance Testing

```bash
# Time puzzle generation
time sudoku generate --difficulty hard --seed 42

# Time solving
time sudoku solve --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"

# Solve multiple puzzles
for seed in {1..100}; do
  sudoku generate --difficulty easy --seed $seed | xargs -I {} sudoku solve --input {}
done
```

---

## Tips and Best Practices

### Input Format

1. **Always use 81 characters** - No more, no less
2. **Use `0` for consistency** - While `.` is supported, `0` is clearer in many contexts
3. **File input for complex workflows** - Easier to manage than long strings in scripts

### Difficulty Selection

1. **Easy**: Good for beginners, quick to solve
2. **Medium**: Balanced challenge
3. **Hard**: For experienced players, may require advanced techniques

### Seeding Strategy

1. **Use meaningful seeds** - e.g., dates (20241201), sequence numbers (1, 2, 3...)
2. **Document seeds** - Keep track of which seeds produce good puzzles
3. **Avoid seed reuse** - Unless you specifically want the same puzzle

### Error Handling

1. **Check exit codes** - Don't just rely on output text
2. **Capture stderr** - Error messages go to stderr, solutions to stdout
3. **Validate before solving** - Catch invalid puzzles early

### Performance

1. **File I/O is fast** - Don't worry about file-based input overhead
2. **Hard puzzles take longer** - Generation and solving time increases with difficulty
3. **Batch processing** - Generate multiple puzzles in parallel if needed

---

## Troubleshooting

### Common Issues

#### "Error: --input option is required"
- You forgot to specify `--input <puzzle>`
- Solution: Add `--input` followed by your puzzle or file path

#### "Invalid puzzle length: expected 81 characters"
- Your puzzle string is too short or too long
- Solution: Ensure exactly 81 characters (9×9 grid)

#### "Invalid character in puzzle"
- You used a character other than 0-9 or `.`
- Solution: Check for spaces, letters, or special characters

#### "File not found or not readable"
- The file path is incorrect or file doesn't exist
- Solution: Check the path, ensure file exists and has read permissions

#### "Duplicate X in row/column/box Y"
- The puzzle violates Sudoku rules
- Solution: Check the input, fix duplicates

#### "Puzzle is unsolvable"
- The puzzle has no valid solution (even though it passes rule checks)
- Solution: Verify the puzzle source, may be an invalid puzzle

---

## Related Documentation

- [README.md](./README.md) - General overview and quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and design
- [docs/AI_READINESS.md](./docs/AI_READINESS.md) - Guide for AI assistants
- [BACKLOG_PACK.md](./BACKLOG_PACK.md) - Original requirements
