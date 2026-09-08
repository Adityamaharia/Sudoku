import test from "node:test";
import assert from "node:assert/strict";
import {
  cloneBoard,
  countSolutions,
  createEmptyBoard,
  generatePuzzle,
  generateSolvedBoard,
  getCandidates,
  isBoardValid,
  isPuzzleSolved,
  solveBoard,
} from "../js/sudoku.js";
import {
  addHint,
  applyMove,
  createGameState,
  getStateSnapshot,
  incrementTimer,
  isFixedCell,
  resetBoard,
  setPauseState,
} from "../js/game.js";

for (const difficulty of ["easy", "medium", "hard"]) {
  test(`${difficulty} puzzles are valid and uniquely solvable`, () => {
    const puzzle = generatePuzzle(difficulty);
    const solution = solveBoard(puzzle);
    const clues = puzzle.flat().filter(Boolean).length;

    assert.equal(isBoardValid(puzzle), true);
    assert.equal(isBoardValid(solution), true);
    assert.equal(countSolutions(puzzle, 2), 1);
    assert.equal(isPuzzleSolved(solution, solution), true);
    assert.equal(clues, { easy: 40, medium: 32, hard: 26 }[difficulty]);
  });
}

test("generated solved boards contain valid candidates and do not mutate", () => {
  const solved = generateSolvedBoard();
  const board = createEmptyBoard();
  board[0][0] = solved[0][0];
  const before = cloneBoard(board);

  assert.deepEqual(getCandidates(board, 0, 1), [
    ...Array.from({ length: 9 }, (_, index) => index + 1).filter(
      (value) => value !== solved[0][0],
    ),
  ]);
  assert.deepEqual(board, before);
});

test("game state tracks moves, hints, pause timing, reset, and snapshots", () => {
  const solution = generateSolvedBoard();
  const puzzle = cloneBoard(solution);
  puzzle[0][0] = 0;
  const game = createGameState({ puzzle, solution, board: cloneBoard(puzzle) });

  const invalid = applyMove(game, 0, 0, solution[0][1]);
  assert.equal(invalid.success, false);
  assert.equal(game.mistakes, 1);

  const hint = addHint(game);
  assert.deepEqual(hint, { row: 0, col: 0, value: solution[0][0] });
  assert.equal(game.hintsUsed, 1);
  assert.equal(isFixedCell(game, 0, 0), true);
  assert.equal(applyMove(game, 0, 0, solution[0][0]).success, false);

  const beforePause = game.elapsedTime;
  setPauseState(game, true);
  assert.equal(incrementTimer(game, 10), beforePause);
  setPauseState(game, false);
  assert.equal(incrementTimer(game, 10), beforePause + 10);

  const snapshot = getStateSnapshot(game);
  snapshot.board[0][0] = 99;
  assert.notEqual(game.board[0][0], 99);

  resetBoard(game);
  assert.equal(game.board[0][0], solution[0][0]);
  assert.equal(game.mistakes, 0);
  assert.equal(game.hintsUsed, 1);
  assert.equal(game.hintedCells.length, 1);
});
