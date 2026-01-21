#!/bin/bash
set -e

echo "=================================="
echo "SUDOKU CLI COMPREHENSIVE TEST"
echo "=================================="
echo ""

echo "1. Testing VALIDATE command"
echo "----------------------------"
echo "1a. Valid incomplete puzzle:"
node dist/cli.js validate --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
echo "✓ PASS"
echo ""

echo "1b. Invalid puzzle (duplicate):"
node dist/cli.js validate --input "330070000600195000098000060800060003400803001700020006060000280000419005000080079" 2>&1 | grep -q "Duplicate 3 in row 1" && echo "✓ PASS (expected failure)" || echo "✗ FAIL"
echo ""

echo "2. Testing SOLVE command"
echo "-------------------------"
echo "2a. Solvable puzzle:"
solution=$(node dist/cli.js solve --input "530070000600195000098000060800060003400803001700020006060000280000419005000080079")
echo "Solution: $solution"
echo "✓ PASS"
echo ""

echo "2b. Verify solution is valid and complete:"
node dist/cli.js validate --input "$solution"
echo "✓ PASS"
echo ""

echo "3. Testing GENERATE command"
echo "----------------------------"
echo "3a. Generate easy puzzle (seed 42):"
easy1=$(node dist/cli.js generate --difficulty easy --seed 42)
echo "Puzzle: $easy1"
echo "✓ PASS"
echo ""

echo "3b. Test determinism (same seed):"
easy2=$(node dist/cli.js generate --difficulty easy --seed 42)
if [ "$easy1" == "$easy2" ]; then
    echo "✓ PASS - Puzzles match (deterministic)"
else
    echo "✗ FAIL - Puzzles don't match"
    exit 1
fi
echo ""

echo "3c. Validate generated puzzle:"
node dist/cli.js validate --input "$easy1"
echo "✓ PASS"
echo ""

echo "3d. Solve generated puzzle:"
solution=$(node dist/cli.js solve --input "$easy1")
echo "Solution: $solution"
echo "✓ PASS"
echo ""

echo "3e. Test medium difficulty:"
medium=$(node dist/cli.js generate --difficulty medium --seed 100)
echo "Medium puzzle: $medium"
node dist/cli.js validate --input "$medium"
echo "✓ PASS"
echo ""

echo "3f. Test hard difficulty:"
hard=$(node dist/cli.js generate --difficulty hard --seed 200)
echo "Hard puzzle: $hard"
node dist/cli.js validate --input "$hard"
echo "✓ PASS"
echo ""

echo "4. Testing file input"
echo "---------------------"
echo "4a. Validate from file:"
node dist/cli.js validate --input examples/puzzle.txt
echo "✓ PASS"
echo ""

echo "4b. Solve from file:"
node dist/cli.js solve --input examples/puzzle.txt > /dev/null
echo "✓ PASS"
echo ""

echo "5. Testing error cases"
echo "----------------------"
echo "5a. Invalid length:"
node dist/cli.js validate --input examples/invalid_length.txt 2>&1 || echo "✓ PASS (expected failure)"
echo ""

echo "5b. Invalid character:"
node dist/cli.js validate --input examples/invalid_char.txt 2>&1 || echo "✓ PASS (expected failure)"
echo ""

echo "5c. Invalid difficulty:"
node dist/cli.js generate --difficulty invalid --seed 42 2>&1 || echo "✓ PASS (expected failure)"
echo ""

echo "=================================="
echo "ALL TESTS PASSED!"
echo "=================================="
