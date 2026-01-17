const VALIDATE_HELP = `
sudoku validate - Validate a Sudoku puzzle

USAGE:
  sudoku validate --input <puzzle>

OPTIONS:
  --input <puzzle>   81-character string or path to file containing puzzle
  --help, -h         Show this help message

DESCRIPTION:
  Validates whether a Sudoku puzzle follows the rules (no duplicates in rows,
  columns, or 3x3 boxes). Reports if the puzzle is valid and complete/incomplete.

EXAMPLES:
  sudoku validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
  sudoku validate --input ./puzzle.txt
`;

export async function runValidateCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(VALIDATE_HELP);
    return;
  }

  const inputIndex = args.indexOf('--input');
  if (inputIndex === -1 || inputIndex === args.length - 1) {
    console.error('Error: --input option is required');
    console.error(`Run 'sudoku validate --help' for usage information.`);
    process.exit(1);
  }

  const input = args[inputIndex + 1];
  
  // TODO (SUD-2): Parse puzzle input (string or file)
  // TODO (SUD-3): Validate puzzle and report status
  
  console.log('validate command: not implemented yet');
  console.log(`Input: ${input}`);
}
