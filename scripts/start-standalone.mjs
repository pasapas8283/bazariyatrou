#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const standaloneDir = join(process.cwd(), ".next", "standalone");
const serverPath = join(standaloneDir, "server.js");

if (!existsSync(serverPath)) {
  console.error(
    "[start-standalone] ERREUR: build standalone manquant.\n" +
      "Sur Render: Build Command = npm ci --include=dev && npm run build:render"
  );
  process.exit(1);
}

const port = process.env.PORT || "3000";
const env = {
  ...process.env,
  PORT: port,
  HOSTNAME: "0.0.0.0",
};

/** Next standalone attend souvent d’être lancé depuis ce dossier (sinon 502 sur Render). */
console.log(
  `[start-standalone] cwd=${standaloneDir} PORT=${port} HOSTNAME=0.0.0.0`
);

const child = spawn(process.execPath, ["server.js"], {
  stdio: "inherit",
  env,
  cwd: standaloneDir,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
