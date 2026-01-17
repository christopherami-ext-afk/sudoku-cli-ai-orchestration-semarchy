#!/usr/bin/env node

import { runValidateCommand } from './commands/validate.js';
import { runSolveCommand } from './commands/solve.js';
import { runGenerateCommand } from './commands/generate.js';

const HELP_TEXT = `
sudoku - A CLI tool for Sudoku puzzles

USAGE:
  sudoku <command> [options]

COMMANDS:
  validate    Validate a Sudoku puzzle
  solve       Solve a Sudoku puzzle
  generate    Generate a new Sudoku puzzle

OPTIONS:
  --help, -h  Show this help message

Run 'sudoku <command> --help' for more information on a command.
`;

function showHelp(): void {
  console.log(HELP_TEXT);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  
  if ((command === '--help' || command === '-h') && args.length === 1) {
    showHelp();
    process.exit(0);
  }

  const commandArgs = args.slice(1);

  switch (command) {
    case 'validate':
      await runValidateCommand(commandArgs);
      break;
    case 'solve':
      await runSolveCommand(commandArgs);
      break;
    case 'generate':
      await runGenerateCommand(commandArgs);
      break;
    default:
      console.error(`Error: Unknown command '${command}'`);
      console.error(`Run 'sudoku --help' for usage information.`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
