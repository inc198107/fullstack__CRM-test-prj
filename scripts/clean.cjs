const { rmSync } = require("node:fs");
const { resolve } = require("node:path");

const projectRoot = resolve(__dirname, "..");
const dist = resolve(projectRoot, "dist");
if (dist !== resolve(projectRoot, "dist")) {
  throw new Error("Refusing to clean a path outside this project");
}
rmSync(dist, { recursive: true, force: true });
