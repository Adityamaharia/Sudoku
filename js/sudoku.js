export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;
export const EMPTY_CELL = 0;

export function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(EMPTY_CELL),
  );
}

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function createBoardFromValues(values) {
  if (!Array.isArray(values) || values.length !== BOARD_SIZE) {
    throw new Error("Board values must be a 9x9 array.");
  }

  return values.map((row) => {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) {
      throw new Error("Each board row must contain 9 values.");
    }

    return [...row];
  });
}

export function isValidValue(board, row, col, value) {
  if (!isValidBoardShape(board)) {
    return false;
  }

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }

  if (value < 1 || value > BOARD_SIZE) {
    return false;
  }

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    if (i !== col && board[row][i] === value) {
      return false;
    }

    if (i !== row && board[i][col] === value) {
      return false;
    }
  }

  const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
    for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
      if ((r !== row || c !== col) && board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

export function hasDuplicatesInUnit(unit) {
  const values = unit.filter((value) => value !== EMPTY_CELL);
  return new Set(values).size !== values.length;
}

export function isBoardValid(board) {
  if (!isValidBoardShape(board)) {
    return false;
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    if (hasDuplicatesInUnit(board[row])) {
      return false;
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const columnValues = Array.from(
      { length: BOARD_SIZE },
      (_, row) => board[row][col],
    );
    if (hasDuplicatesInUnit(columnValues)) {
      return false;
    }
  }

  for (let boxRow = 0; boxRow < BOARD_SIZE; boxRow += BOX_SIZE) {
    for (let boxCol = 0; boxCol < BOARD_SIZE; boxCol += BOX_SIZE) {
      const boxValues = [];

      for (let row = boxRow; row < boxRow + BOX_SIZE; row += 1) {
        for (let col = boxCol; col < boxCol + BOX_SIZE; col += 1) {
          boxValues.push(board[row][col]);
        }
      }

      if (hasDuplicatesInUnit(boxValues)) {
        return false;
      }
    }
  }

  return true;
}

export function isValidPlacement(board, row, col, value) {
  if (!isValidBoardShape(board)) {
    return false;
  }

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }

  if (value === EMPTY_CELL) {
    return true;
  }

  if (board[row][col] !== EMPTY_CELL && board[row][col] !== value) {
    return false;
  }

  const testBoard = cloneBoard(board);
  testBoard[row][col] = value;

  return isBoardValid(testBoard);
}

export function findEmptyCell(board) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === EMPTY_CELL) {
        return { row, col };
      }
    }
  }

  return null;
}

export function isBoardComplete(board) {
  return findEmptyCell(board) === null;
}

export function getCandidates(board, row, col) {
  if (
    !isValidBoardShape(board) ||
    row < 0 ||
    row >= BOARD_SIZE ||
    col < 0 ||
    col >= BOARD_SIZE
  ) {
    return [];
  }

  if (board[row][col] !== EMPTY_CELL) {
    return [];
  }

  const candidates = new Set(
    Array.from({ length: BOARD_SIZE }, (_, index) => index + 1),
  );

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    if (board[row][i] !== EMPTY_CELL) {
      candidates.delete(board[row][i]);
    }

    if (board[i][col] !== EMPTY_CELL) {
      candidates.delete(board[i][col]);
    }
  }

  const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
    for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
      if (board[r][c] !== EMPTY_CELL) {
        candidates.delete(board[r][c]);
      }
    }
  }

  return [...candidates];
}

export function isValidBoardShape(board) {
  return (
    Array.isArray(board) &&
    board.length === BOARD_SIZE &&
    board.every((row) => Array.isArray(row) && row.length === BOARD_SIZE)
  );
}

export function getDifficultyConfig(difficulty) {
  const config = {
    easy: { clues: 40 },
    medium: { clues: 32 },
    hard: { clues: 26 },
  };

  return config[difficulty] || config.easy;
}

export function isPuzzleSolved(board, solutionBoard) {
  if (!isValidBoardShape(board) || !isValidBoardShape(solutionBoard)) {
    return false;
  }

  return board.every((row, rowIndex) =>
    row.every((value, colIndex) => value === solutionBoard[rowIndex][colIndex]),
  );
}

export function shuffleArray(values) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

export function solveBoard(board) {
  if (!isValidBoardShape(board)) {
    throw new Error("Board must be a 9x9 array.");
  }

  const workingBoard = cloneBoard(board);

  if (!solveBoardInternal(workingBoard)) {
    return null;
  }

  return workingBoard;
}

function solveBoardInternal(board) {
  const emptyCell = findBestEmptyCell(board);

  if (!emptyCell) {
    return true;
  }

  const { row, col } = emptyCell;
  const candidates = shuffleArray(emptyCell.candidates);

  for (const value of candidates) {
    if (!isValidPlacement(board, row, col, value)) {
      continue;
    }

    board[row][col] = value;

    if (solveBoardInternal(board)) {
      return true;
    }

    board[row][col] = EMPTY_CELL;
  }

  return false;
}

export function generateSolvedBoard() {
  const board = createEmptyBoard();

  function fillBoard() {
    const emptyCell = findBestEmptyCell(board);

    if (!emptyCell) {
      return true;
    }

    const { row, col } = emptyCell;
    const candidates = shuffleArray(emptyCell.candidates);

    for (const value of candidates) {
      if (!isValidPlacement(board, row, col, value)) {
        continue;
      }

      board[row][col] = value;

      if (fillBoard()) {
        return true;
      }

      board[row][col] = EMPTY_CELL;
    }

    return false;
  }

  fillBoard();
  return board;
}

export function countSolutions(board, limit = 2) {
  if (!isValidBoardShape(board)) {
    return 0;
  }

  const workingBoard = cloneBoard(board);
  let solutions = 0;

  function backtrack() {
    if (solutions >= limit) {
      return;
    }

    const emptyCell = findBestEmptyCell(workingBoard);

    if (!emptyCell) {
      solutions += 1;
      return;
    }

    const { row, col } = emptyCell;

    for (const value of shuffleArray(emptyCell.candidates)) {
      if (!isValidPlacement(workingBoard, row, col, value)) {
        continue;
      }

      workingBoard[row][col] = value;
      backtrack();
      workingBoard[row][col] = EMPTY_CELL;

      if (solutions >= limit) {
        return;
      }
    }
  }

  backtrack();
  return solutions;
}

function findBestEmptyCell(board) {
  let bestCell = null;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== EMPTY_CELL) {
        continue;
      }

      const candidates = getCandidates(board, row, col);
      if (!bestCell || candidates.length < bestCell.candidates.length) {
        bestCell = { row, col, candidates };
      }

      if (candidates.length <= 1) {
        return bestCell;
      }
    }
  }

  return bestCell;
}

export function hasUniqueSolution(board) {
  return countSolutions(board, 2) === 1;
}

export function generatePuzzle(difficulty = "easy") {
  const solvedBoard = generateSolvedBoard();
  const puzzle = cloneBoard(solvedBoard);
  const targetClues = getDifficultyConfig(difficulty).clues;
  const positions = shuffleArray(
    Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index),
  );

  let removedCount = 0;

  for (const position of positions) {
    if (BOARD_SIZE * BOARD_SIZE - removedCount <= targetClues) {
      break;
    }

    const row = Math.floor(position / BOARD_SIZE);
    const col = position % BOARD_SIZE;
    const previousValue = puzzle[row][col];

    puzzle[row][col] = EMPTY_CELL;

    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[row][col] = previousValue;
      continue;
    }

    removedCount += 1;
  }

  return puzzle;
}

export function isBoardSolved(board) {
  return isBoardComplete(board) && isBoardValid(board);
}

export function getBlankBoard() {
  return createEmptyBoard();
}

export function generateSudokuPuzzle() {
  return generatePuzzle("easy");
}
