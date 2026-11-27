const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const express = require("express");
const passport = require("passport");

const root = process.env.APP_ROOT;
if (!root) throw new Error("APP_ROOT must be set by scripts/test.cjs");

function load(relativeModule) {
  const moduleValue = require(resolve(root, relativeModule));
  return moduleValue.default ?? moduleValue;
}

function responseSpy() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function request(app, path, options = {}) {
  const server = createServer(app);
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  try {
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}${path}`, options);
  } finally {
    await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
  }
}

test("application use cases are independent from Express, Mongoose and JWT", async () => {
  const { Login } = load("application/use-cases/auth/Login");
  const { Register } = load("application/use-cases/auth/Register");
  const users = new Map();
  const repository = {
    async findByEmail(email) { return users.get(email) ?? null; },
    async findById(id) { return [...users.values()].find((user) => user.id === id) ?? null; },
    async create({ email, passwordHash }) {
      const user = { id: "507f1f77bcf86cd799439011", email, passwordHash };
      users.set(email, user);
      return user;
    },
  };
  const passwords = {
    async hash(password) { return `hash:${password}`; },
    async verify(password, hash) { return hash === `hash:${password}`; },
  };
  const tokens = { issue: ({ email, userId }) => `${email}:${userId}` };
  const register = new Register(repository, passwords);
  const login = new Login(repository, passwords, tokens);

  assert.deepEqual(await register.execute("user@example.test", "password"), {
    kind: "registered",
    user: { id: "507f1f77bcf86cd799439011", email: "user@example.test", passwordHash: "hash:password" },
  });
  assert.deepEqual(await register.execute("user@example.test", "password"), { kind: "email-already-exists" });
  assert.deepEqual(await login.execute("missing@example.test", "password"), { kind: "user-not-found" });
  assert.deepEqual(await login.execute("user@example.test", "wrong"), { kind: "wrong-credentials" });
  assert.deepEqual(await login.execute("user@example.test", "password"), {
    kind: "authenticated",
    token: "user@example.test:507f1f77bcf86cd799439011",
  });
});

test("HTTP auth adapter preserves response statuses and token envelope", async () => {
  const { createAuthController } = load("adapters/http/controllers/auth");
  const login = { execute: async (email, password) => {
    if (email === "missing@example.test") return { kind: "user-not-found" };
    if (password !== "password") return { kind: "wrong-credentials" };
    return { kind: "authenticated", token: "signed-token" };
  } };
  const register = { execute: async (email) => email === "existing@example.test"
    ? { kind: "email-already-exists" }
    : { kind: "registered", user: { id: "507f1f77bcf86cd799439011", email, passwordHash: "hash" } } };
  const controller = createAuthController({ login, register });

  const loginResponse = responseSpy();
  await controller.login({ body: { email: "user@example.test", password: "password" } }, loginResponse);
  assert.deepEqual(loginResponse.body, { accessToken: "Bearer signed-token" });
  assert.equal(loginResponse.statusCode, 200);

  const wrongResponse = responseSpy();
  await controller.login({ body: { email: "user@example.test", password: "wrong" } }, wrongResponse);
  assert.deepEqual(wrongResponse.body, { message: "Wrong credentials" });
  assert.equal(wrongResponse.statusCode, 401);

  const missingResponse = responseSpy();
  await controller.login({ body: { email: "missing@example.test", password: "password" } }, missingResponse);
  assert.deepEqual(missingResponse.body, { message: "User not found" });
  assert.equal(missingResponse.statusCode, 404);

  const registerResponse = responseSpy();
  await controller.register({ body: { email: "new@example.test", password: "password" } }, registerResponse);
  assert.deepEqual(registerResponse.body, { new_user: { _id: "507f1f77bcf86cd799439011", email: "new@example.test", password: "hash" } });
  assert.equal(registerResponse.statusCode, 201);

  const duplicateResponse = responseSpy();
  await controller.register({ body: { email: "existing@example.test", password: "password" } }, duplicateResponse);
  assert.deepEqual(duplicateResponse.body, { message: "Email already exist" });
  assert.equal(duplicateResponse.statusCode, 409);
});

test("passport adapter validates claims and delegates principal lookup through its port", async () => {
  const { configurePassport } = load("infrastructure/auth/passportJwt");
  const principal = { id: "507f1f77bcf86cd799439011", email: "user@example.test", passwordHash: "hash" };
  const calls = [];
  const repository = {
    findByEmail: async () => null,
    findById: async (id) => { calls.push(id); return id === principal.id ? principal : null; },
    create: async () => principal,
  };
  configurePassport(passport, repository, process.env.JWT_SECRET);
  const verify = passport._strategy("jwt")._verify;

  await new Promise((resolveDone, rejectDone) => verify({ userId: principal.id }, (error, user) => {
    try { assert.equal(error, null); assert.equal(user, principal); resolveDone(); } catch (error) { rejectDone(error); }
  }));
  await new Promise((resolveDone, rejectDone) => verify({ userId: "not-an-object-id" }, (error, user) => {
    try { assert.equal(error, null); assert.equal(user, false); resolveDone(); } catch (error) { rejectDone(error); }
  }));
  assert.deepEqual(calls, [principal.id]);
});

test("Mongoose models remain infrastructure adapters with their original names and schema defaults", () => {
  const { UserModel } = load("infrastructure/database/mongoose/models/UserModel");
  const { CategoryModel } = load("infrastructure/database/mongoose/models/CategoryModel");
  const { OrderModel } = load("infrastructure/database/mongoose/models/OrderModel");
  const { PositionModel } = load("infrastructure/database/mongoose/models/PositionModel");
  assert.equal(UserModel.modelName, "users");
  assert.equal(CategoryModel.modelName, "categories");
  assert.equal(OrderModel.modelName, "orders");
  assert.equal(PositionModel.modelName, "positions");
  assert.equal(new UserModel({ password: "hash" }).email, "");
  assert.equal(new CategoryModel({ name: "category" }).imageSrc, "");
  assert.equal(CategoryModel.schema.path("user").options.ref, "users");
  assert.equal(PositionModel.schema.path("category").options.ref, "categories");
  assert.equal(OrderModel.schema.path("user").options.ref, "users");
});

test("category GET remains protected by the configured passport adapter", async () => {
  const { configurePassport } = load("infrastructure/auth/passportJwt");
  const { createCategoryRouter } = load("adapters/http/routes/category");
  configurePassport(passport, { findById: async () => null }, process.env.JWT_SECRET);
  const app = express();
  app.use(passport.initialize());
  app.use("/api/category", createCategoryRouter(passport));
  const response = await request(app, "/api/category/");
  assert.equal(response.status, 401);
});

test("the composed app finishes infrastructure failures through the HTTP error adapter", async (t) => {
  const app = load("main/app").app;
  const { UserModel } = load("infrastructure/database/mongoose/models/UserModel");
  t.mock.method(UserModel, "findOne", async () => null);
  t.mock.method(UserModel.prototype, "save", async () => { throw new Error("database failure"); });
  const response = await request(app, "/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "failed@example.test", password: "password" }),
  });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Internal server error" });
});

test("error adapter forwards client errors and hides internal diagnostics", (t) => {
  const { errorHandler } = load("adapters/http/middleware/error");
  const forwarded = [];
  errorHandler({ statusCode: 418 }, {}, { headersSent: false }, (error) => forwarded.push(error));
  assert.equal(forwarded[0].statusCode, 418);
  const response = responseSpy();
  const errorMock = t.mock.method(console, "error", () => {});
  errorHandler(new Error("sensitive database detail"), {}, response, () => {});
  assert.deepEqual(response.body, { error: "Internal server error" });
  assert.deepEqual(errorMock.mock.calls.map((call) => call.arguments), [["server error: internal"]]);
});

test("startup connects before listening and cleans up failures", async () => {
  const { start } = load("main/index");
  const events = [];
  await start({
    connect: async () => { events.push("connect"); },
    listen: async (port) => { events.push(`listen:${port}`); },
    disconnect: async () => { events.push("disconnect"); },
    log: (message) => { events.push(message); },
  });
  assert.deepEqual(events, ["connect", "DB connected", "listen:5000", "listen on 5000"]);

  const failed = [];
  await assert.rejects(start({
    connect: async () => { failed.push("connect"); throw new Error("failure"); },
    listen: async () => { failed.push("listen"); },
    disconnect: async () => { failed.push("disconnect"); },
    log: (message) => { failed.push(message); },
  }), { message: "Application startup failed" });
  assert.deepEqual(failed, ["connect", "startup failure: connect", "disconnect"]);
});

test("compiled entry fails before listening when MongoDB is unavailable", () => {
  const result = spawnSync(process.execPath, ["dist/main/index.js"], {
    cwd: resolve(root, ".."),
    env: { ...process.env, MONGO_URI: "mongodb://127.0.0.1:1/crm_test?serverSelectionTimeoutMS=50", JWT_SECRET: "test-secret" },
    encoding: "utf8",
    timeout: 5_000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /startup failure: connect/);
  assert.doesNotMatch(result.stdout + result.stderr, /listen on|mongodb:\/\//i);
});

test("compiled configuration rejects missing environment variables without revealing values", () => {
  const environment = { ...process.env };
  delete environment.MONGO_URI;
  delete environment.JWT_SECRET;
  const result = spawnSync(process.execPath, ["-e", "require('./dist/infrastructure/config')"], {
    cwd: resolve(root, ".."),
    env: environment,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing required environment variable/);
  assert.doesNotMatch(result.stderr, /mongodb:\/\//i);
});
