import {
  cloneBoard,
  EMPTY_CELL,
  isBoardSolved,
  isValidPlacement,
} from "./sudoku.js";

export const MAX_MISTAKES = 3;

export function createGameState({
  puzzle = [],
  solution = [],
  difficulty = "easy",
  board = [],
  mistakes = 0,
  elapsedTime = 0,
  isPaused = false,
  isComplete = false,
  selectedCell = null,
  hintsUsed = 0,
  hintedCells = [],
} = {}) {
  const safePuzzle =
    Array.isArray(puzzle) && puzzle.length ? cloneBoard(puzzle) : [];
  const safeSolution =
    Array.isArray(solution) && solution.length ? cloneBoard(solution) : [];
  const safeBoard =
    Array.isArray(board) && board.length
      ? cloneBoard(board)
      : cloneBoard(safePuzzle);

  return {
    puzzle: safePuzzle,
    solution: safeSolution,
    board: safeBoard,
    difficulty,
    mistakes,
    elapsedTime,
    isPaused,
    isComplete,
    selectedCell,
    hintsUsed,
    hintedCells: hintedCells.map(({ row, col }) => ({ row, col })),
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };
}

export function getCellValue(gameState, row, col) {
  if (!gameState || !Array.isArray(gameState.board)) {
    return EMPTY_CELL;
  }

  if (
    row < 0 ||
    row >= gameState.board.length ||
    col < 0 ||
    col >= gameState.board[row].length
  ) {
    return EMPTY_CELL;
  }

  return gameState.board[row][col];
}

export function setSelectedCell(gameState, row, col) {
  if (!gameState) {
    return;
  }

  if (row === null || col === null) {
    gameState.selectedCell = null;
    gameState.lastUpdatedAt = Date.now();
    return;
  }

  gameState.selectedCell = { row, col };
  gameState.lastUpdatedAt = Date.now();
}

export function isFixedCell(gameState, row, col) {
  if (!gameState || !Array.isArray(gameState.puzzle)) {
    return false;
  }

  const isPuzzleCell = Boolean(
    gameState.puzzle[row] && gameState.puzzle[row][col] !== EMPTY_CELL,
  );

  return (
    isPuzzleCell ||
    gameState.hintedCells?.some((cell) => cell.row === row && cell.col === col)
  );
}

export function canEditCell(gameState, row, col) {
  if (!gameState || gameState.isPaused || gameState.isComplete) {
    return false;
  }

  return !isFixedCell(gameState, row, col);
}

export function applyMove(gameState, row, col, value) {
  if (!gameState || !canEditCell(gameState, row, col)) {
    return { success: false, reason: "cell-not-editable" };
  }

  if (!isValidPlacement(gameState.board, row, col, value)) {
    gameState.mistakes += 1;
    gameState.lastUpdatedAt = Date.now();
    return {
      success: false,
      reason: "invalid-move",
      mistakes: gameState.mistakes,
    };
  }

  gameState.board[row][col] = value;
  gameState.lastUpdatedAt = Date.now();

  if (
    gameState.solution.length &&
    gameState.board[row][col] !== gameState.solution[row][col]
  ) {
    // This allows the UI to detect a wrong move while preserving the board state.
    return { success: true, isCorrect: false };
  }

  const solved = isBoardSolved(gameState.board);
  if (solved) {
    gameState.isComplete = true;
    gameState.lastUpdatedAt = Date.now();
  }

  return { success: true, isCorrect: true, isComplete: solved };
}

export function clearCell(gameState, row, col) {
  if (!gameState || !canEditCell(gameState, row, col)) {
    return { success: false, reason: "cell-not-editable" };
  }

  gameState.board[row][col] = EMPTY_CELL;
  gameState.lastUpdatedAt = Date.now();

  return { success: true };
}

export function addHint(gameState) {
  if (!gameState || gameState.isPaused || gameState.isComplete) {
    return null;
  }

  for (let row = 0; row < gameState.solution.length; row += 1) {
    for (let col = 0; col < gameState.solution[row].length; col += 1) {
      if (
        gameState.board[row][col] === EMPTY_CELL &&
        gameState.solution[row][col] !== EMPTY_CELL
      ) {
        gameState.board[row][col] = gameState.solution[row][col];
        gameState.hintsUsed += 1;
        gameState.hintedCells.push({ row, col });
        gameState.lastUpdatedAt = Date.now();
        return { row, col, value: gameState.solution[row][col] };
      }
    }
  }

  return null;
}

export function resetBoard(gameState) {
  if (!gameState) {
    return;
  }

  gameState.board = cloneBoard(gameState.puzzle);
  gameState.hintedCells.forEach(({ row, col }) => {
    gameState.board[row][col] = gameState.solution[row][col];
  });
  gameState.mistakes = 0;
  gameState.isComplete = false;
  gameState.isPaused = false;
  gameState.selectedCell = null;
  gameState.lastUpdatedAt = Date.now();
}

export function setPauseState(gameState, isPaused) {
  if (!gameState) {
    return;
  }

  gameState.isPaused = Boolean(isPaused);
  gameState.lastUpdatedAt = Date.now();
}

export function incrementTimer(gameState, seconds = 1) {
  if (!gameState || gameState.isPaused || gameState.isComplete) {
    return gameState?.elapsedTime ?? 0;
  }

  gameState.elapsedTime += seconds;
  gameState.lastUpdatedAt = Date.now();
  return gameState.elapsedTime;
}

export function getStateSnapshot(gameState) {
  if (!gameState) {
    return null;
  }

  return {
    puzzle: cloneBoard(gameState.puzzle),
    solution: cloneBoard(gameState.solution),
    board: cloneBoard(gameState.board),
    difficulty: gameState.difficulty,
    mistakes: gameState.mistakes,
    elapsedTime: gameState.elapsedTime,
    isPaused: gameState.isPaused,
    isComplete: gameState.isComplete,
    selectedCell: gameState.selectedCell ? { ...gameState.selectedCell } : null,
    hintsUsed: gameState.hintsUsed,
    hintedCells: gameState.hintedCells.map((cell) => ({ ...cell })),
    startedAt: gameState.startedAt,
    lastUpdatedAt: gameState.lastUpdatedAt,
  };
}

export function restoreGameState(savedState) {
  if (!savedState) {
    return null;
  }

  return createGameState({
    puzzle: savedState.puzzle,
    solution: savedState.solution,
    board: savedState.board,
    difficulty: savedState.difficulty,
    mistakes: savedState.mistakes,
    elapsedTime: savedState.elapsedTime,
    isPaused: savedState.isPaused,
    isComplete: savedState.isComplete,
    selectedCell: savedState.selectedCell,
    hintsUsed: savedState.hintsUsed,
    hintedCells: savedState.hintedCells,
  });
}
