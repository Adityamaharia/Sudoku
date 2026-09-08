import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "www");

mkdirSync(output, { recursive: true });

for (const file of ["index.html", "manifest.webmanifest", "sw.js"]) {
  cpSync(resolve(root, file), resolve(output, file));
}

for (const directory of ["css", "js", "assets"]) {
  cpSync(resolve(root, directory), resolve(output, directory), {
    recursive: true,
  });
}
