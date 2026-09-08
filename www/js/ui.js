import { EMPTY_CELL } from "./sudoku.js";

const BOARD_SELECTOR = "#sudoku-board";

export function getBoardElement() {
  return document.querySelector(BOARD_SELECTOR);
}

export function renderBoard(gameState) {
  const boardElement = getBoardElement();
  if (!boardElement || !gameState || !Array.isArray(gameState.board)) {
    return;
  }

  boardElement.innerHTML = "";

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const cell = document.createElement("button");
      const value = gameState.board[row][col];
      const isFixed = gameState.puzzle[row][col] !== EMPTY_CELL;
      const isHinted = gameState.hintedCells?.some(
        (hintedCell) => hintedCell.row === row && hintedCell.col === col,
      );
      const isSelected =
        gameState.selectedCell &&
        gameState.selectedCell.row === row &&
        gameState.selectedCell.col === col;
      const isRelated =
        gameState.selectedCell &&
        (gameState.selectedCell.row === row ||
          gameState.selectedCell.col === col ||
          (Math.floor(gameState.selectedCell.row / 3) === Math.floor(row / 3) &&
            Math.floor(gameState.selectedCell.col / 3) ===
              Math.floor(col / 3)));

      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Row ${row + 1}, Column ${col + 1}`);

      if (isFixed || isHinted) cell.classList.add("fixed");
      if (isHinted) cell.classList.add("hinted");
      if (isSelected) cell.classList.add("selected");
      if (isRelated && !isSelected) cell.classList.add("related");
      if (value !== EMPTY_CELL && value !== gameState.solution[row][col]) {
        cell.classList.add("error");
      }

      if (value === EMPTY_CELL) {
        cell.textContent = "";
      } else {
        cell.textContent = String(value);
      }

      boardElement.appendChild(cell);
    }
  }
}

export function updateTimer(value) {
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = value;
}

export function updateMistakes(value) {
  const mistakesEl = document.getElementById("mistakes");
  if (mistakesEl) mistakesEl.textContent = String(value);
}

export function updateHints(value) {
  const hintsEl = document.getElementById("hints-used");
  if (hintsEl) hintsEl.textContent = String(value);
}

export function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });
}

export function showMessage(message, type = "info") {
  const messageBox = document.getElementById("message-box");
  if (!messageBox) {
    console.log(message);
    return;
  }

  messageBox.textContent = message;
  messageBox.dataset.type = type;
  messageBox.hidden = false;

  window.clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = window.setTimeout(() => {
    messageBox.hidden = true;
  }, 1800);
}

export function clearMessage() {
  const messageBox = document.getElementById("message-box");
  if (messageBox) {
    messageBox.hidden = true;
    messageBox.textContent = "";
  }
}
