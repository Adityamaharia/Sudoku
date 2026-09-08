# Sudoku Project Flow

## 1. Project Overview

This is a mobile-first Sudoku game built with HTML, CSS, and Vanilla JavaScript. The Sudoku engine and game state are separated from DOM rendering so the same core logic can be used in a PWA and later packaged with Capacitor for Android and iOS.

**Stack:** HTML5, CSS3, ES modules, Vanilla JavaScript, `localStorage`, PWA manifest/service worker, Capacitor 8, Node test runner.

## 2. Current Project Structure

```text
index.html                 Application shell and screens
css/style.css              Mobile-first layout, themes, board states
js/
├── app.js                 Startup, navigation, events, orchestration
├── game.js                Serializable game state and gameplay actions
├── sudoku.js              Validation, solving, generation, uniqueness
├── ui.js                  DOM rendering and messages
└── storage.js             localStorage abstraction
assets/                    Local icons and sounds
scripts/build-web.mjs      Copies root web source into www/
tests/sudoku.test.js       Engine and game-state regression tests
www/                       Capacitor web output
manifest.webmanifest       PWA metadata and icon
sw.js                      Offline app-shell service worker
capacitor.config.json      Capacitor app configuration
android/                   Generated Capacitor Android project
ios/                       Generated Capacitor iOS project
README.md                  Setup and packaging notes
flow.md                    This project map and roadmap
```

## 3. Module Responsibilities

| Module          | Main responsibility                                                      | Important functions                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app.js`        | Application startup, navigation, input routing, persistence coordination | `init`, `createNewGame`, `showHome`, `showSettings`, `resumeSavedGame`, `handleCellInput`, `handleErase`, `checkProgress`, `shareScore`, `startTimer`              |
| `game.js`       | Game state, edit rules, hints, timer, pause/reset, snapshots             | `createGameState`, `applyMove`, `clearCell`, `addHint`, `resetBoard`, `setPauseState`, `incrementTimer`, `getStateSnapshot`, `restoreGameState`                    |
| `sudoku.js`     | Board validation, candidates, solving, generation, uniqueness            | `isBoardValid`, `isValidPlacement`, `getCandidates`, `solveBoard`, `generateSolvedBoard`, `countSolutions`, `hasUniqueSolution`, `generatePuzzle`, `isBoardSolved` |
| `ui.js`         | DOM board rendering, screen state, status messages, counters             | `renderBoard`, `showScreen`, `showMessage`, `updateTimer`, `updateMistakes`, `updateHints`                                                                         |
| `storage.js`    | Browser persistence boundary                                             | `saveGame`, `loadGame`, `saveSettings`, `loadSettings`, `saveNavigation`, `loadNavigation`                                                                         |
| `build-web.mjs` | Build the Capacitor web directory                                        | Copies root HTML/CSS/JS/assets into `www/`                                                                                                                         |

## 4. Application Execution Flow

```text
User opens index.html
↓
ES module js/app.js loads
↓
app.js attaches board/control events
↓
app.js loads settings, saved game, and navigation state
↓
sudoku.js generates a puzzle when a new game is requested
↓
game.js creates the serializable game state
↓
ui.js renders the board and screen
↓
storage.js persists game/settings/navigation state
↓
User interacts through the board and controls
```

On startup, an unfinished session is restored to the Pause screen when the last navigation state was a game/pause state. A Home navigation state remains Home. A completed session returns Home on refresh, with Resume Game able to reopen the Win screen.

## 5. Important User Flows

### A. Application startup

```text
Browser loads index.html
↓
app.js.init()
↓
loadSettings(), loadGame(), loadNavigation()
↓
applyTheme() and choose the correct screen
↓
startTimer() and/or renderGame()
```

### B. New Game

```text
User chooses Easy, Medium, or Hard
↓
app.js difficulty handler
↓
createNewGame()
↓
sudoku.js.generatePuzzle() + solveBoard()
↓
game.js.createGameState()
↓
persistGame() + startTimer()
↓
ui.js.showScreen("game-screen") + renderGame()
```

### C. Cell selection

```text
User taps a board cell
↓
app.js board click handler
↓
selectCell()
↓
game.js.setSelectedCell()
↓
ui.js.renderBoard()
↓
selected, related, fixed, hinted, and error states update
```

### D. Player enters number

```text
User taps number pad or presses 1-9
↓
app.js.handleCellInput()
↓
game.js.applyMove()
↓
sudoku.js.isValidPlacement()
↓
board/mistakes/completion state changes
↓
ui.js.renderBoard() and counters update
↓
persistGame()
```

### E. Invalid move

```text
User enters a conflicting value
↓
app.js.handleCellInput()
↓
game.js.applyMove() returns success:false
↓
mistakes increments
↓
ui.js.showMessage("Invalid move") + renderGame()
↓
persistGame() on the normal action path
```

### F. Hint

```text
User presses Hint
↓
app.js hint handler
↓
game.js.addHint()
↓
solution value is inserted and hintedCells receives the coordinate
↓
hintsUsed increments
↓
ui.js renders the value as a fixed/locked cell
↓
persistGame()
```

Hinted cells cannot be edited or erased and are restored by `resetBoard()`.

### G. Check

```text
User presses Check
↓
app.js.checkProgress()
↓
board values are compared with solution
↓
ui.js.renderBoard() marks incorrect entries
↓
showMessage() reports incorrect entries or remaining cells
↓
complete board sets isComplete and opens Win screen
```

### H. Reset

```text
User presses Reset
↓
app.js reset handler
↓
game.js.resetBoard()
↓
editable cells return to puzzle values
↓
hinted cells remain filled and locked
↓
ui.js.renderBoard()
↓
persistGame()
```

### I. Timer

```text
createNewGame() or restore
↓
app.js.startTimer()
↓
every second: game.js.incrementTimer()
↓
ui.js.updateTimer()
```

The timer does not advance while `isPaused` or `isComplete` is true.

### J. Save game

```text
State-changing action
↓
app.js.persistGame()
↓
state arrays and selected cell are serialized
↓
storage.js.saveGame()
↓
localStorage[sudoku-game-state]
```

### K. Restore game

```text
Page refresh
↓
storage.js.loadGame() + loadNavigation()
↓
game.js.createGameState(savedState)
↓
navigation state selects Home or Pause
↓
Resume Game reopens game-screen or win-screen
↓
ui.js renders when the game screen is entered
```

### L. Puzzle completion

```text
Correct final value or Check detects complete board
↓
sudoku.js.isBoardSolved()
↓
gameState.isComplete = true
↓
app.js saves navigation state "win"
↓
ui.js.showScreen("win-screen")
↓
share score and next puzzle actions become available
```

## 6. Data Flow

```text
Generated puzzle:
sudoku.js → app.js → game.js → ui.js

Player move:
UI event → app.js → game.js → sudoku.js → game state → ui.js → storage.js

Hint:
app.js → game.js.addHint() → game state.hintedCells → ui.js → storage.js

Saved game:
game state → app.js.persistGame() → storage.js → localStorage

Restored game:
localStorage → storage.js → app.js → game.js.createGameState() → ui.js

Navigation:
app.js → storage.js.saveNavigation() → localStorage
```

## 7. Game State

```text
gameState
├── puzzle          Original givens
├── solution        Completed solution board
├── board           Current player board
├── difficulty      easy, medium, or hard
├── mistakes        Invalid move count
├── elapsedTime     Active seconds played
├── isPaused        Whether editing/timer are paused
├── isComplete      Whether the puzzle is solved
├── selectedCell    Current { row, col } or null
├── hintsUsed       Number of hints used in this puzzle
├── hintedCells     Coordinates of permanently locked hint cells
├── startedAt       State creation timestamp
└── lastUpdatedAt   Last state mutation timestamp
```

## 8. Development Stages

### Stage 1 — Project shell

Status: [x]

Created the HTML entry point, module layout, package setup, README, and ignore rules.

Files: `index.html`, `package.json`, `js/`, `css/`.
Depends on: None.
Leads to: UI and engine implementation.

### Stage 2 — Mobile-first interface

Status: [x]

Created responsive screens, board layout, controls, safe-area support, dark/light CSS variables, and accessibility labels.

Files: `index.html`, `css/style.css`, `js/ui.js`.
Depends on: Stage 1.
Leads to: Interactive board integration.

### Stage 3 — Sudoku engine

Status: [x]

Implemented validation, candidates, MRV-backed solving, solved-board generation, puzzle generation, and uniqueness checking.

Files: `js/sudoku.js`.
Depends on: Stage 1.
Leads to: Game state and gameplay.

### Stage 4 — Game state layer

Status: [x]

Implemented serializable state, moves, edit rules, hints, locked hinted cells, timer, pause, reset, completion, and snapshots.

Files: `js/game.js`.
Depends on: Stage 3.
Leads to: Application coordination.

### Stage 5 — Browser gameplay integration

Status: [x]

Connected difficulty selection, board selection, number pad, keyboard input, Check, Hint, Reset, Pause, Resume, Home, Win, and Share flows.

Files: `js/app.js`, `js/ui.js`, `index.html`.
Depends on: Stages 2–4.
Leads to: Persistence and UX hardening.

### Stage 6 — Persistence and navigation

Status: [x]

Added localStorage game/settings/navigation persistence, Home/Resume behavior, and refresh routing for Home, ongoing, paused, and completed states.

Files: `js/storage.js`, `js/app.js`, `js/game.js`.
Depends on: Stage 4 and browser gameplay.
Leads to: Reliable refresh and mobile packaging.

### Stage 7 — PWA support

Status: [x]

Added manifest, local icon, service worker app shell, offline caching, and cache versioning.

Files: `manifest.webmanifest`, `sw.js`, `assets/icons/`.
Depends on: Stable browser app and local assets.
Leads to: Installable browser app.

### Stage 8 — Regression coverage

Status: [x]

Added Node tests for generation, uniqueness, candidates, moves, hints, locking, reset, pause timing, and snapshots.

Files: `tests/sudoku.test.js`, `package.json`.
Depends on: Engine and game state.
Leads to: Safer iteration.

### Stage 9 — Capacitor scaffolding

Status: [x]

Added Capacitor configuration, CLI/platform packages, Android/iOS projects, `www/` build output, and `npm run cap:sync`.

Files: `capacitor.config.json`, `scripts/build-web.mjs`, `android/`, `ios/`.
Depends on: PWA-ready web app.
Leads to: Native builds.

### Stage 10 — Android debug artifact

Status: [x]

Built and verified the Android debug APK using Java 21 and Android API 36. Android unit tests and APK signature verification pass.

Artifact: `android/app/build/outputs/apk/debug/app-debug.apk`.
Depends on: Stage 9, Java 11+, Android SDK.
Leads to: Device/emulator testing and release signing.

### Stage 11 — Theme and Settings UX

Status: [x]

Added persistent Light/Dark themes and moved theme selection into a dedicated Settings screen opened from Home.

Files: `index.html`, `css/style.css`, `js/app.js`, `js/storage.js`.
Depends on: Persistence and screen navigation.
Leads to: Further UX polish.

### Current stage — Release hardening and product polish

Status: [~]

The core app and native scaffolding are functional. Current work is focused on UI polish, release checks, accessibility, and deciding which product features belong before release.

Depends on: Stages 1–11.

## 9. Remaining Development Stages

### Stage 12 — Automated UI test coverage

Status: [ ]

Purpose: Add repeatable browser tests for Home, Settings, theme persistence, Check, Hint locking, refresh routing, and Pause → Resume rendering.

Files/modules: Browser test setup, `app.js`, `ui.js`, `index.html`.
Depends on: Stable screen IDs and local web server.
Expected result: UI regressions are caught automatically instead of only by manual browser checks.

### Stage 13 — Android device/emulator testing

Status: [ ]

Purpose: Install the debug APK and verify touch input, safe areas, localStorage, offline loading, and back/navigation behavior.

Files/modules: `android/`, Capacitor web bundle.
Depends on: Android SDK, emulator or device, Stage 10.
Expected result: Confirm behavior inside the native WebView.

### Stage 14 — Android release packaging

Status: [ ]

Purpose: Configure signing, release build settings, versioning, and a distributable release artifact.

Files/modules: Android Gradle configuration, signing configuration, README.
Depends on: Stage 13 and release credentials.
Expected result: Signed Android release build.

### Stage 15 — iOS build and device testing

Status: [ ]

Purpose: Open the generated project in Xcode, configure signing, build, and test on an iOS simulator/device.

Files/modules: `ios/`.
Depends on: macOS, Xcode, Apple signing setup, Stage 9.
Expected result: Tested iOS app build.

### Stage 16 — Release quality pass

Status: [ ]

Purpose: Review accessibility, offline cache updates, app icons, privacy text, dependency audit findings, performance, and store metadata.

Files/modules: `index.html`, `css/style.css`, `manifest.webmanifest`, `sw.js`, package metadata.
Depends on: Stages 12–15.
Expected result: Release-ready web/PWA/Android/iOS packages.

## 10. Current Implementation Gaps

### Critical

- Android release signing is not configured; only a debug APK exists.
- iOS has been scaffolded and synced but cannot be built/tested on Windows.
- No automated browser UI test suite exists yet.

### Useful

- Android device/emulator behavior has not been verified.
- Service-worker cache invalidation is manual through cache version changes.
- `createGameState()` recreates timestamps during restore rather than preserving saved timestamps exactly.
- The browser app has no backend, account system, cloud sync, or cross-device progress.

### Optional

- Statistics, best times, streaks, daily puzzles, achievements, sound controls, and richer animations.
- Additional difficulty-generation tuning beyond fixed clue targets.
- Formal release privacy, accessibility, and store metadata review.

## 11. Future Features

### Near future

- **Statistics and best times**
  ↓ Use completed game snapshots and storage.js
  ↓ Add a statistics view without changing sudoku.js.

- **Daily puzzle and streaks**
  ↓ Add deterministic puzzle selection and a date-based record
  ↓ Build on sudoku.js generation and storage.js.

- **More accessibility and interaction polish**
  ↓ Improve focus management, screen-reader announcements, and touch feedback
  ↓ Build on ui.js and the existing semantic controls.

### Later

- **Cloud synchronization**
  ↓ Replace or extend storage.js with an authenticated remote adapter
  ↓ Keep game.js and sudoku.js platform-independent.

- **Accounts and leaderboards**
  ↓ Add a backend identity and score service
  ↓ Reuse completion metrics from app.js/game.js.

### Long term

- **Achievements and social competition**
  ↓ Add event/history storage and server APIs
  ↓ Build on completed game data and platform share support.

- **Monetization or premium content**
  ↓ Add product/account infrastructure only after core retention features exist
  ↓ Keep the core Sudoku engine unchanged.

## 12. Web → PWA → Mobile Roadmap

```text
Vanilla JS Web App
↓
Fully functional mobile-first Web App
↓
PWA manifest and service worker
↓
Offline support and installable Web App
↓
Capacitor integration
↓
Android + iOS projects
↓
Native build, device testing, signing, release
```

### Web app → PWA

Add the manifest, local icons, service worker, and cache strategy. Existing `sudoku.js`, `game.js`, and most of `app.js` remain unchanged.

### PWA → Capacitor

Use `scripts/build-web.mjs` to copy the web app into `www/`, then `npx cap sync`. The native layer hosts the same web UI; core logic remains unchanged.

### Capacitor → Android/iOS

Native platform projects add build configuration, permissions, signing, and device integration. Platform-specific code should stay in `android/`, `ios/`, or future adapters. `sudoku.js` and `game.js` should remain DOM-free and reusable.

## 13. Capacitor Preparation Checklist

- [x] Web app works offline
- [x] Assets are local
- [x] No unnecessary CDN dependency
- [x] Game state is serializable
- [x] Storage is abstracted
- [x] Core Sudoku logic has no DOM dependency
- [x] Touch controls work in the browser
- [x] Responsive mobile layout exists
- [x] App icon prepared
- [x] PWA manifest prepared
- [x] Service worker prepared
- [x] Capacitor installed
- [x] Android platform added
- [x] iOS platform added
- [x] Android debug APK built and verified
- [ ] Android release signing configured
- [ ] iOS build verified on macOS/Xcode

## 14. Architecture Decisions

- Vanilla JavaScript keeps the app lightweight and framework-independent.
- `sudoku.js` contains algorithms and no DOM manipulation.
- `game.js` owns mutable gameplay state and edit rules.
- `ui.js` owns DOM rendering and screen presentation.
- `storage.js` isolates local persistence and navigation/settings storage.
- Hints are stored as locked coordinates so hinted values survive Reset and reload.
- The app uses local-first persistence; no backend is required for the core game.
- Capacitor is a packaging layer, not a rewrite of the game engine.

## 15. Change Log

### 2026-09-09

- Added dedicated Settings screen with persistent Light/Dark themes.
- Added Android/iOS Capacitor scaffolding and verified Android debug APK.
- Added refresh-aware Home/Pause/Win navigation and locked hinted cells.

### 2026-09-08

- Completed gameplay, persistence, PWA, regression tests, and Capacitor sync workflow.

## Maintenance Notes

Keep this file synchronized when modules, public functions, screen flows, development stages, or platform packaging assumptions change. Keep it focused on project map, execution flow, roadmap, and real implementation limits rather than documenting every helper or CSS rule.
