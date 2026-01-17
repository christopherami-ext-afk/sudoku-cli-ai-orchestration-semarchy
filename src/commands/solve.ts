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
  
  // TODO (SUD-2): Parse puzzle input (string or file)
  // TODO (SUD-3): Validate puzzle
  // TODO (SUD-4): Solve puzzle and output solution
  
  console.log('solve command: not implemented yet');
  console.log(`Input: ${input}`);
}
