#!/usr/bin/env node
/**
 * Build Next en `output: export` pour Capacitor.
 * - Force `BZY_SHARED_BETA=0` (export statique / dossier `out/`), même si `.env.production` a `1`.
 * - Déplace temporairement `src/app/api` : `output: export` ne supporte pas les Route Handlers
 *   comme le serveur standalone. L'APK avec `CAP_SERVER_URL` appelle l'API sur Render.
 */
import { cpSync, existsSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const apiDir = join(root, "src/app/api");
const backupDir = join(root, "src/.capacitor_api_backup");

const capOrigin =
  process.env.CAP_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_CAP_API_ORIGIN?.trim() ||
  "https://bazariyatrou-2.onrender.com";

const env = {
  ...process.env,
  BZY_SHARED_BETA: "0",
  NEXT_PUBLIC_CAP_API_ORIGIN: capOrigin,
};

function moveApiAside() {
  if (!existsSync(apiDir)) return false;
  if (existsSync(backupDir)) rmSync(backupDir, { recursive: true, force: true });
  try {
    renameSync(apiDir, backupDir);
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : undefined;
    // Windows peut verrouiller temporairement le dossier (EPERM/EXDEV) : fallback copy+delete.
    if (code !== "EPERM" && code !== "EXDEV") throw error;
    cpSync(apiDir, backupDir, { recursive: true });
    rmSync(apiDir, { recursive: true, force: true });
  }
  return true;
}

function restoreApi(moved) {
  if (!moved) return;
  if (existsSync(backupDir) && !existsSync(apiDir)) {
    try {
      renameSync(backupDir, apiDir);
    } catch (error) {
      const code = error && typeof error === "object" ? error.code : undefined;
      if (code !== "EPERM" && code !== "EXDEV") throw error;
      cpSync(backupDir, apiDir, { recursive: true });
      rmSync(backupDir, { recursive: true, force: true });
    }
  }
}

let moved = false;
let exitCode = 1;
try {
  moved = moveApiAside();
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    env,
    shell: true,
  });
  exitCode = result.status ?? 1;
} finally {
  restoreApi(moved);
}

process.exit(exitCode);
