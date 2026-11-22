const { readdirSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");

const target = process.argv[2];
if (target !== "source" && target !== "dist") {
  throw new Error("Usage: node scripts/test.cjs <source|dist>");
}

const root = target === "source" ? process.cwd() : resolve(process.cwd(), "dist");
const files = readdirSync(resolve(process.cwd(), "tests"))
  .filter((file) => file.endsWith(".test.cjs"))
  .sort()
  .map((file) => resolve(process.cwd(), "tests", file));

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  env: {
    ...process.env,
    APP_ROOT: root,
    MONGO_URI: "mongodb://127.0.0.1:27017/crm_test",
    JWT_SECRET: "ts-migration-test-secret",
    NODE_ENV: "test",
    PORT: undefined,
    NODE_OPTIONS: undefined,
  },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
