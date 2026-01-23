import { parseInput, ParseError } from '../core/parser.js';
import { validateGrid } from '../core/validator.js';
import { solveGrid } from '../core/solver.js';

const SOLVE_HELP = `
sudoku solve - Solve a Sudoku puzzle

USAGE:
  sudoku solve --input <puzzle>

OPTIONS:
  --input <puzzle>   81-character string or path to file containing puzzle
  --help, -h         Show this help message

DESCRIPTION:
  Solves a Sudoku puzzle and outputs the solution as an 81-character string.
  Reports an error if the puzzle is invalid or unsolvable.

EXAMPLES:
  sudoku solve --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
  sudoku solve --input ./puzzle.txt
`;

export async function runSolveCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(SOLVE_HELP);
    return;
  }

  const inputIndex = args.indexOf('--input');
  if (inputIndex === -1 || inputIndex === args.length - 1) {
    console.error('Error: --input option is required');
    console.error(`Run 'sudoku solve --help' for usage information.`);
    process.exit(1);
  }

  const input = args[inputIndex + 1];
  
  try {
    const grid = await parseInput(input);

    const validation = validateGrid(grid);
    if (validation.status === 'invalid') {
      const issue = validation.issues[0];
      const unitName = issue.type === 'row'
        ? `row ${issue.index}`
        : issue.type === 'column'
          ? `column ${issue.index}`
          : `box ${issue.index}`;

      console.error(`Invalid puzzle: duplicate ${issue.value} in ${unitName}`);
      process.exit(1);
    }

    const result = solveGrid(grid);
    if (!result.solved || !result.grid) {
      if (result.reason === 'invalid') {
        console.error('Invalid puzzle');
      } else {
        console.error('Puzzle is unsolvable');
      }
      process.exit(1);
    }

    const solution = result.grid.flat().join('');
    if (solution.length !== 81 || solution.includes('0')) {
      console.error('Puzzle is unsolvable');
      process.exit(1);
    }

    console.log(solution);
    process.exit(0);
  } catch (error) {
    if (error instanceof ParseError) {
      console.error(`Parse error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}
