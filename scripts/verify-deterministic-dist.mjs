#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const dist = join(root, "dist");

function run(command) {
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "0", TZ: "UTC" },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function files(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? files(path) : [path];
    });
}

function fingerprint() {
  const hash = createHash("sha256");
  for (const path of files(dist)) {
    const name = relative(dist, path).replaceAll("\\", "/");
    const mode = statSync(path).mode & 0o777;
    hash.update(name);
    hash.update("\0");
    hash.update(mode.toString(8));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function build() {
  if (!existsSync(join(dist, "qwertycoin.js"))) {
    console.error("dist/qwertycoin.js is missing; run the pinned full WASM build first");
    process.exit(1);
  }
  run("npm run build_commonjs");
  run("npm run build_web_worker");
  return fingerprint();
}

const first = build();
const second = build();
if (first !== second) {
  console.error(`distribution is not deterministic: ${first} != ${second}`);
  process.exit(1);
}
console.log(`deterministic distribution sha256: ${first}`);
