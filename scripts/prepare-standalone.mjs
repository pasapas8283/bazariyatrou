#!/usr/bin/env node
/**
 * Après `next build` en mode standalone (BZY_SHARED_BETA=1), copie static + public
 * requis par Render / Node (sinon pages cassées ou serveur instable).
 */
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(join(standaloneDir, "server.js"))) {
  console.error(
    "[prepare-standalone] ERREUR: .next/standalone/server.js introuvable.\n" +
      "Le build Render doit avoir BZY_SHARED_BETA=1 (pas export statique)."
  );
  process.exit(1);
}

const copies = [
  { from: join(root, ".next", "static"), to: join(standaloneDir, ".next", "static") },
  { from: join(root, "public"), to: join(standaloneDir, "public") },
];

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.warn(`[prepare-standalone] skip (absent): ${from}`);
    continue;
  }
  cpSync(from, to, { recursive: true });
  console.log(`[prepare-standalone] copied ${from} -> ${to}`);
}

console.log("[prepare-standalone] OK");
