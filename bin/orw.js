#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const binDir = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(binDir, "..", "src", "index.ts");
const bun = process.platform === "win32" ? "bun.exe" : "bun";
const result = spawnSync(bun, [cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  if (result.error && "code" in result.error && result.error.code === "ENOENT") {
    console.error("@cortexkit/orw requires Bun. Install it from https://bun.sh/ and retry.");
  } else {
    console.error(result.error.message);
  }
  process.exit(1);
}

process.exit(result.status ?? 1);
