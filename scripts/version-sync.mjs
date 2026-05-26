#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;

function parseArgs(argv) {
  const args = argv.slice(2);
  let version = null;
  let fromTag = false;
  let dryRun = false;

  for (const arg of args) {
    if (arg === "--from-tag") {
      fromTag = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (!version && !arg.startsWith("-")) {
      version = arg;
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  if (fromTag) {
    const ref = process.env.GITHUB_REF_NAME;
    if (!ref) {
      console.error("--from-tag requires GITHUB_REF_NAME environment variable");
      process.exit(1);
    }
    version = ref.replace(/^v/, "");
  }

  if (!version) {
    console.error(
      "Usage: version-sync.mjs <version> [--dry-run]\n" +
        "       version-sync.mjs --from-tag [--dry-run]",
    );
    process.exit(1);
  }

  if (!SEMVER_RE.test(version)) {
    console.error(`Invalid semver version: '${version}'`);
    process.exit(1);
  }

  return { version, dryRun };
}

const { version, dryRun } = parseArgs(process.argv);
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

if (pkg.version === version) {
  console.log(`package.json: (already at ${version})`);
} else {
  console.log(`package.json: ${pkg.version} → ${version}`);
  pkg.version = version;
  if (!dryRun) writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}
