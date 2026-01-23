const GENERATE_HELP = `
sudoku generate - Generate a new Sudoku puzzle

USAGE:
  sudoku generate --difficulty <level> --seed <number>

OPTIONS:
  --difficulty <level>   Difficulty level: easy, medium, or hard
  --seed <number>        Random seed for deterministic generation
  --help, -h             Show this help message

DESCRIPTION:
  Generates a valid, solvable Sudoku puzzle at the specified difficulty level.
  Using the same seed and difficulty will always produce the same puzzle.

EXAMPLES:
  sudoku generate --difficulty easy --seed 42
  sudoku generate --difficulty medium --seed 12345
  sudoku generate --difficulty hard --seed 99
`;

import { generatePuzzle, type Difficulty } from '../core/generator.js';

export async function runGenerateCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(GENERATE_HELP);
    return;
  }

  const difficultyIndex = args.indexOf('--difficulty');
  const seedIndex = args.indexOf('--seed');

  if (difficultyIndex === -1 || difficultyIndex === args.length - 1) {
    console.error('Error: --difficulty option is required');
    console.error(`Run 'sudoku generate --help' for usage information.`);
    process.exit(1);
  }

  if (seedIndex === -1 || seedIndex === args.length - 1) {
    console.error('Error: --seed option is required');
    console.error(`Run 'sudoku generate --help' for usage information.`);
    process.exit(1);
  }

  const difficulty = args[difficultyIndex + 1];
  const seed = args[seedIndex + 1];

  const allowed = new Set(['easy', 'medium', 'hard']);
  if (!allowed.has(difficulty)) {
    console.error(`Error: invalid difficulty '${difficulty}'. Must be one of: easy, medium, hard`);
    process.exit(1);
  }

  const seedNumber = Number.parseInt(seed, 10);
  if (!Number.isFinite(seedNumber) || !Number.isInteger(seedNumber)) {
    console.error(`Error: --seed must be an integer, got '${seed}'`);
    process.exit(1);
  }

  const result = generatePuzzle({ difficulty: difficulty as Difficulty, seed: seedNumber });

  const puzzleString = result.puzzle.flat().map((v) => (v === 0 ? '0' : String(v))).join('');
  console.log(puzzleString);
}
