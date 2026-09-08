import {
  generatePuzzle,
  solveBoard,
  EMPTY_CELL,
  isBoardSolved,
} from "./sudoku.js";
import {
  addHint,
  applyMove,
  canEditCell,
  clearCell,
  createGameState,
  incrementTimer,
  MAX_MISTAKES,
  resetBoard,
  setPauseState,
  setSelectedCell,
} from "./game.js";
import {
  renderBoard,
  showMessage,
  showScreen,
  updateHints,
  updateMistakes,
  updateTimer,
} from "./ui.js";
import {
  loadGame,
  loadNavigation,
  loadSettings,
  saveGame,
  saveNavigation,
  saveSettings,
} from "./storage.js";

const state = {
  game: null,
  timerId: null,
  difficulty: "easy",
};

const elements = {
  difficultyButtons: document.querySelectorAll("[data-difficulty]"),
  board: document.getElementById("sudoku-board"),
  hint: document.getElementById("btn-hint"),
  check: document.getElementById("btn-check"),
  reset: document.getElementById("btn-reset"),
  pause: document.getElementById("btn-pause"),
  resume: document.getElementById("btn-resume"),
  newGame: document.getElementById("btn-new-game"),
  home: document.getElementById("btn-home"),
  resumeGame: document.getElementById("btn-resume-game"),
  newFromPause: document.getElementById("btn-new-from-pause"),
  homeFromPause: document.getElementById("btn-home-from-pause"),
  nextPuzzle: document.getElementById("btn-next-puzzle"),
  homeFromWin: document.getElementById("btn-home-from-win"),
  share: document.getElementById("btn-share"),
  erase: document.getElementById("btn-erase"),
  numberButtons: document.querySelectorAll(".btn-number"),
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function persistGame() {
  if (!state.game) {
    return;
  }

  saveGame({
    ...state.game,
    board: state.game.board.map((row) => [...row]),
    puzzle: state.game.puzzle.map((row) => [...row]),
    solution: state.game.solution.map((row) => [...row]),
    selectedCell: state.game.selectedCell
      ? { ...state.game.selectedCell }
      : null,
  });

  saveSettings({
    difficulty: state.difficulty,
  });
}

function updateStats() {
  if (!state.game) {
    return;
  }

  updateTimer(formatTime(state.game.elapsedTime));
  updateMistakes(`${state.game.mistakes}/${MAX_MISTAKES}`);
  updateHints(state.game.hintsUsed);
}

function updateOverlayStats() {
  if (!state.game) {
    return;
  }

  const pauseTime = document.getElementById("pause-time");
  const winTime = document.getElementById("win-time");
  const winMistakes = document.getElementById("win-mistakes");

  if (pauseTime)
    pauseTime.textContent = `Time: ${formatTime(state.game.elapsedTime)}`;
  if (winTime)
    winTime.textContent = `Time: ${formatTime(state.game.elapsedTime)}`;
  if (winMistakes) winMistakes.textContent = `Mistakes: ${state.game.mistakes}`;
}

function getScoreText() {
  return `I completed a ${state.game.difficulty} Sudoku in ${formatTime(
    state.game.elapsedTime,
  )} with ${state.game.mistakes} mistakes.`;
}

async function shareScore() {
  if (!state.game) {
    return;
  }

  const text = getScoreText();

  try {
    if (navigator.share) {
      await navigator.share({ title: "Sudoku score", text });
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showMessage("Score copied to clipboard.", "success");
      return;
    }
  } catch {
    showMessage("Sharing was cancelled.", "info");
    return;
  }

  showMessage(text, "info");
}

function startTimer() {
  window.clearInterval(state.timerId);
  state.timerId = window.setInterval(() => {
    if (!state.game || state.game.isPaused || state.game.isComplete) {
      return;
    }

    incrementTimer(state.game, 1);
    updateStats();
  }, 1000);
}

function renderGame() {
  if (!state.game) {
    return;
  }

  renderBoard(state.game);
  updateStats();
}

function createNewGame(difficulty = state.difficulty) {
  const puzzle = generatePuzzle(difficulty);
  const solution = solveBoard(puzzle);

  state.game = createGameState({
    puzzle,
    solution,
    board: puzzle.map((row) => [...row]),
    difficulty,
    mistakes: 0,
    elapsedTime: 0,
    isPaused: false,
    isComplete: false,
    selectedCell: null,
    hintsUsed: 0,
  });

  elements.share.hidden = true;
  persistGame();
  startTimer();
  showScreen("game-screen");
  saveNavigation("game");
  renderGame();
}

function showHome() {
  if (state.game && !state.game.isComplete) {
    setPauseState(state.game, true);
    persistGame();
  }

  elements.resumeGame.hidden = !state.game;
  saveNavigation("home");
  showScreen("difficulty-screen");
}

function resumeSavedGame() {
  if (!state.game) {
    return;
  }

  if (state.game.isComplete) {
    elements.share.hidden = false;
    saveNavigation("win");
    showScreen("win-screen");
    return;
  }

  setPauseState(state.game, false);
  persistGame();
  saveNavigation("game");
  showScreen("game-screen");
  renderGame();
}

function selectCell(row, col) {
  if (
    !state.game ||
    state.game.isPaused ||
    state.game.isComplete ||
    row < 0 ||
    row > 8 ||
    col < 0 ||
    col > 8
  ) {
    return;
  }

  setSelectedCell(state.game, row, col);
  renderGame();
}

function handleCellInput(value) {
  if (!state.game || !state.game.selectedCell) {
    showMessage("Select a cell first.", "info");
    return;
  }

  const { row, col } = state.game.selectedCell;

  if (!canEditCell(state.game, row, col)) {
    showMessage("Fixed cells cannot be edited.", "warning");
    return;
  }

  const result = applyMove(state.game, row, col, value);

  if (!result.success) {
    showMessage("Invalid move.", "warning");
    renderGame();
    return;
  }

  if (state.game.solution[row][col] !== value) {
    showMessage("Not quite there.", "info");
  }

  if (isBoardSolved(state.game.board)) {
    showMessage("Puzzle complete!", "success");
    state.game.isComplete = true;
    updateOverlayStats();
    elements.share.hidden = false;
    saveNavigation("win");
    showScreen("win-screen");
  }

  persistGame();
  renderGame();
}

function handleErase() {
  if (!state.game || !state.game.selectedCell) {
    showMessage("Select a cell first.", "info");
    return;
  }

  const { row, col } = state.game.selectedCell;
  clearCell(state.game, row, col);
  persistGame();
  renderGame();
}

function checkProgress() {
  if (!state.game) {
    return;
  }

  let incorrectCells = 0;
  let emptyCells = 0;

  state.game.board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === EMPTY_CELL) {
        emptyCells += 1;
      } else if (value !== state.game.solution[rowIndex][colIndex]) {
        incorrectCells += 1;
      }
    });
  });

  renderGame();

  if (incorrectCells > 0) {
    showMessage(
      `${incorrectCells} incorrect ${incorrectCells === 1 ? "entry" : "entries"} highlighted.`,
      "warning",
    );
    return;
  }

  if (emptyCells === 0) {
    state.game.isComplete = true;
    updateOverlayStats();
    elements.share.hidden = false;
    saveNavigation("win");
    persistGame();
    showMessage("Puzzle complete!", "success");
    showScreen("win-screen");
    return;
  }

  showMessage(
    `No incorrect entries. ${emptyCells} ${emptyCells === 1 ? "cell" : "cells"} remaining.`,
    "success",
  );
}

function attachBoardEvents() {
  elements.board.addEventListener("click", (event) => {
    const cell = event.target.closest(".cell");
    if (!cell) {
      return;
    }

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    selectCell(row, col);
  });
}

function attachControlEvents() {
  elements.difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.difficulty = button.dataset.difficulty;
      saveSettings({ difficulty: state.difficulty });
      createNewGame(state.difficulty);
    });
  });

  elements.hint.addEventListener("click", () => {
    if (!state.game) {
      return;
    }

    const result = addHint(state.game);
    if (result) {
      showMessage(
        `Hint: row ${result.row + 1}, column ${result.col + 1} = ${result.value}`,
        "info",
      );
    } else {
      showMessage("No more hints available.", "warning");
    }

    persistGame();
    renderGame();
  });

  elements.check.addEventListener("click", () => {
    checkProgress();
  });

  elements.reset.addEventListener("click", () => {
    if (!state.game) {
      return;
    }

    resetBoard(state.game);
    persistGame();
    renderGame();
  });

  elements.pause.addEventListener("click", () => {
    if (!state.game) {
      return;
    }

    setPauseState(state.game, true);
    persistGame();
    saveNavigation("pause");
    updateOverlayStats();
    showScreen("pause-screen");
  });

  elements.resume.addEventListener("click", () => {
    if (!state.game) {
      return;
    }

    setPauseState(state.game, false);
    persistGame();
    saveNavigation("game");
    showScreen("game-screen");
    renderGame();
  });

  elements.newGame.addEventListener("click", () => {
    createNewGame(state.difficulty);
  });

  elements.home.addEventListener("click", showHome);
  elements.resumeGame.addEventListener("click", resumeSavedGame);

  elements.newFromPause.addEventListener("click", () => {
    createNewGame(state.difficulty);
  });

  elements.homeFromPause.addEventListener("click", showHome);

  elements.nextPuzzle.addEventListener("click", () => {
    createNewGame(state.difficulty);
  });

  if (elements.homeFromWin) {
    elements.homeFromWin.addEventListener("click", showHome);
  }

  elements.share.addEventListener("click", shareScore);

  elements.erase.addEventListener("click", handleErase);

  elements.numberButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const value = Number(button.dataset.number);
      handleCellInput(value);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!state.game) {
      return;
    }

    if (event.key >= "1" && event.key <= "9") {
      handleCellInput(Number(event.key));
    }

    if (
      event.key === "Backspace" ||
      event.key === "Delete" ||
      event.key === "0"
    ) {
      handleErase();
    }

    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      const current = state.game.selectedCell;
      if (!current) {
        selectCell(0, 0);
        return;
      }

      let nextRow = current.row;
      let nextCol = current.col;

      if (event.key === "ArrowUp") nextRow = Math.max(0, current.row - 1);
      if (event.key === "ArrowDown") nextRow = Math.min(8, current.row + 1);
      if (event.key === "ArrowLeft") nextCol = Math.max(0, current.col - 1);
      if (event.key === "ArrowRight") nextCol = Math.min(8, current.col + 1);

      selectCell(nextRow, nextCol);
    }
  });
}

function init() {
  attachBoardEvents();
  attachControlEvents();

  const savedSettings = loadSettings();
  if (savedSettings && savedSettings.difficulty) {
    state.difficulty = savedSettings.difficulty;
  }

  const savedGame = loadGame();
  if (savedGame) {
    state.game = createGameState(savedGame);
    const savedNavigation = loadNavigation();
    const shouldStayHome = savedNavigation === "home" || state.game.isComplete;

    if (!state.game.isComplete && !shouldStayHome) {
      setPauseState(state.game, true);
      persistGame();
    }
    startTimer();
    updateOverlayStats();
    elements.share.hidden = !state.game.isComplete;
    elements.resumeGame.hidden = false;
    showScreen(shouldStayHome ? "difficulty-screen" : "pause-screen");
    return;
  }

  showScreen("difficulty-screen");
  updateTimer("00:00");
  updateMistakes("0/3");
  updateHints(0);
}

init();
