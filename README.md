# Sudoku App

A mobile-first Sudoku web app built with HTML, CSS, and modern vanilla JavaScript. The architecture is designed to be reusable for future PWA and Capacitor-based Android/iOS app packaging.

## Project Structure

- `index.html` – application shell
- `css/style.css` – mobile-first responsive styling
- `js/app.js` – application startup and event wiring
- `js/ui.js` – UI rendering and visual state
- `js/game.js` – game state and gameplay logic
- `js/sudoku.js` – Sudoku generation, validation, solving, and puzzle logic
- `js/storage.js` – local persistence abstraction
- `assets/` – local app assets


## PWA and Capacitor path

The app includes a web manifest and service worker for installable offline browser use. The engine, game state, storage API, and UI remain separate so Capacitor can replace the storage implementation later without rewriting gameplay.

### Native packaging handoff

The repository includes `capacitor.config.json` with `www/` configured as the Capacitor source. The checked-in web source remains at the project root. Use `npm run cap:sync` to rebuild `www/` and synchronize both native projects.

```bash
npm install --save-dev @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npm run cap:sync
```

Run `npx cap open android` or `npx cap open ios` to continue in the native IDE. The Sudoku engine and gameplay modules do not need to be rewritten.

### Android build prerequisites

Android builds require a Java 11+ JDK and the Android SDK. Configure `JAVA_HOME` and `ANDROID_HOME` (or add `android/local.properties` with `sdk.dir=...`), then run:

```bash
cd android
gradlew.bat assembleDebug
```

## Notes

This project intentionally keeps the game engine independent from the browser UI so it can later be reused in a Capacitor app with minimal changes.
