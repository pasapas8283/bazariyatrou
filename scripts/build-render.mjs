#!/usr/bin/env node
/**
 * Build production Render : standalone + copie assets.
 * Force BZY_SHARED_BETA=1 même si .env.production.local existe en local.
 */
import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  BZY_SHARED_BETA: "1",
  NODE_ENV: "production",
};

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env, shell: true });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

run("npx", ["next", "build"]);
run("node", ["scripts/prepare-standalone.mjs"]);
