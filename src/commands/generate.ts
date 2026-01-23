import { formatGridVisual } from '../core/parser.js';
import { generatePuzzle, Difficulty } from '../core/generator.js';

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

  const difficulty = args[difficultyIndex + 1] as Difficulty;
  const seedStr = args[seedIndex + 1];
  
  // Validate difficulty
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    console.error(`Error: Invalid difficulty '${difficulty}'. Must be 'easy', 'medium', or 'hard'`);
    process.exit(1);
  }
  
  // Parse seed
  const seed = parseInt(seedStr, 10);
  if (isNaN(seed)) {
    console.error(`Error: Invalid seed '${seedStr}'. Must be a number`);
    process.exit(1);
  }
  
  try {
    // Generate the puzzle (SUD-5)
    const result = generatePuzzle({ difficulty, seed });
    
    // Output the puzzle as a visual grid
    const puzzleString = formatGridVisual(result.puzzle);
    console.log(puzzleString);
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Generation error: ${error.message}`);
    } else {
      console.error('Generation error: Unknown error');
    }
    process.exit(1);
  }
}
