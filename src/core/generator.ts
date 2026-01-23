import type { Grid, CellValue } from '../types/grid.js';
import { validateGrid } from './validator.js';
import { solveGrid } from './solver.js';
import { createPrng, type Prng } from './prng.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GenerateOptions {
  difficulty: Difficulty;
  seed: number;
}

export interface GenerateResult {
  puzzle: Grid;
  solution: Grid;
}

// A known valid solved grid (base template). Generator applies seeded permutations.
const BASE_SOLUTION: Grid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice()) as Grid;
}

function shuffleInPlace<T>(arr: T[], prng: Prng): void {
  // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = prng.nextInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

function permuteDigits(grid: Grid, prng: Prng): Grid {
  const digits: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffleInPlace(digits, prng);

  const mapping = new Map<number, CellValue>();
  for (let i = 0; i < 9; i++) {
    mapping.set(i + 1, digits[i] as CellValue);
  }

  const out = cloneGrid(grid);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = out[r][c];
      out[r][c] = mapping.get(v) ?? v;
    }
  }
  return out;
}

function permuteRows(grid: Grid, prng: Prng): Grid {
  const bandOrder = [0, 1, 2];
  shuffleInPlace(bandOrder, prng);

  const rowOrder: number[] = [];
  for (const band of bandOrder) {
    const rows = [band * 3 + 0, band * 3 + 1, band * 3 + 2];
    shuffleInPlace(rows, prng);
    rowOrder.push(...rows);
  }

  return rowOrder.map((r) => grid[r].slice()) as Grid;
}

function permuteCols(grid: Grid, prng: Prng): Grid {
  const stackOrder = [0, 1, 2];
  shuffleInPlace(stackOrder, prng);

  const colOrder: number[] = [];
  for (const stack of stackOrder) {
    const cols = [stack * 3 + 0, stack * 3 + 1, stack * 3 + 2];
    shuffleInPlace(cols, prng);
    colOrder.push(...cols);
  }

  const out: Grid = [];
  for (let r = 0; r < 9; r++) {
    const row: CellValue[] = [];
    for (let i = 0; i < 9; i++) {
      row.push(grid[r][colOrder[i]]);
    }
    out.push(row);
  }
  return out;
}

function makeSolvedGrid(seed: number): Grid {
  const prng = createPrng(seed);

  // Apply permutations in a deterministic order.
  let grid = cloneGrid(BASE_SOLUTION);
  grid = permuteDigits(grid, prng);
  grid = permuteRows(grid, prng);
  grid = permuteCols(grid, prng);

  return grid;
}

function removalsForDifficulty(difficulty: Difficulty): number {
  // Heuristics (simple + deterministic): fixed number of removed cells.
  // easy: 45 clues (36 empty)
  // medium: 35 clues (46 empty)
  // hard: 27 clues (54 empty)
  switch (difficulty) {
    case 'easy':
      return 36;
    case 'medium':
      return 46;
    case 'hard':
      return 54;
  }
}

export function generatePuzzle(opts: GenerateOptions): GenerateResult {
  const { difficulty, seed } = opts;
  const prng = createPrng(seed);

  const solution = makeSolvedGrid(seed);

  const puzzle = cloneGrid(solution);
  const removals = removalsForDifficulty(difficulty);

  const positions: number[] = [];
  for (let i = 0; i < 81; i++) positions.push(i);
  shuffleInPlace(positions, prng);

  for (let k = 0; k < removals; k++) {
    const idx = positions[k];
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    puzzle[row][col] = 0;
  }

  // Safety checks per acceptance criteria.
  const puzzleValidation = validateGrid(puzzle);
  if (puzzleValidation.status === 'invalid') {
    throw new Error('Generated puzzle is invalid (unexpected)');
  }

  const solved = solveGrid(puzzle);
  if (!solved.solved) {
    throw new Error('Generated puzzle is not solvable (unexpected)');
  }

  return { puzzle, solution };
}
