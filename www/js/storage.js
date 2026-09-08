const STORAGE_KEYS = {
  game: "sudoku-game-state",
  settings: "sudoku-settings",
  navigation: "sudoku-navigation-state",
};

export function saveGame(gameState) {
  try {
    localStorage.setItem(STORAGE_KEYS.game, JSON.stringify(gameState));
  } catch {
    return false;
  }

  return true;
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.game);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGame() {
  localStorage.removeItem(STORAGE_KEYS.game);
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    return false;
  }

  return true;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveNavigation(screen) {
  try {
    localStorage.setItem(STORAGE_KEYS.navigation, screen);
  } catch {
    return false;
  }

  return true;
}

export function loadNavigation() {
  try {
    return localStorage.getItem(STORAGE_KEYS.navigation);
  } catch {
    return null;
  }
}
