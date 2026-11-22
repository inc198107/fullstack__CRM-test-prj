# CRM API

Node 24 / Express / MongoDB API organized as a hexagonal architecture. TypeScript sources are compiled to CommonJS in `dist/`.

## Structure

```text
src/
├── domain/                         # framework-independent business types
├── application/
│   ├── ports/                      # interfaces required by use cases
│   └── use-cases/                  # application business flow
├── adapters/http/                  # Express controllers, routes and middleware
├── infrastructure/                 # Mongoose, bcrypt, JWT and environment adapters
└── main/                           # composition root and process startup
```

Dependency direction is inward: HTTP and infrastructure adapters depend on application ports/use cases; the domain does not depend on Express, Mongoose, bcrypt, or JWT. `src/main/app.ts` is the sole composition root: it selects the Mongoose repository, bcrypt hasher and JWT issuer, wires them into the auth use cases, configures Passport, and creates the Express app.

Implemented auth seams:

- `UserRepository` — persistence required by auth use cases;
- `PasswordHasher` — password hashing and verification;
- `TokenIssuer` — JWT creation.

`MongooseUserRepository`, `BcryptPasswordHasher`, and `JwtTokenIssuer` implement these ports. Existing Category, Position, Orders, and Analytics endpoints remain unimplemented Express adapters; their Mongoose schemas are placed under the infrastructure adapter.

## Setup and commands

```sh
npm ci
# Create a local .env from .env.example and set MONGO_URI and JWT_SECRET.
npm run typecheck
npm test
npm run build
node --env-file=.env --enable-source-maps dist/main/index.js
```

`npm start` runs the compiled entry point and requires `MONGO_URI` and `JWT_SECRET` in the environment. `npm run dev` watches `src/`, rebuilds, and starts the compiled runtime. `npm test` supplies fake environment values and Mongoose model mocks, so it does not use a local `.env` or a real database.

## Preserved HTTP contract

- `POST /api/auth/login` emits `Bearer <JWT>` with a one-hour lifetime.
- `POST /api/auth/register`, `GET /api/auth/logout`, routes, verbs, and existing response statuses are retained.
- `GET /api/category/` remains the only JWT-protected route.
- Mongoose model names remain `users`, `categories`, `positions`, and `orders`.

## Configuration and startup

The runtime reads `MONGO_URI` and `JWT_SECRET`; do not put credentials in tracked files. Importing the app does not open a database connection. Startup connects to MongoDB before binding the HTTP port and exits nonzero on startup failure.

## Limitations

The non-auth CRM use cases have not been implemented yet. They should follow the same flow: add domain concepts and application use cases/ports first, then create Mongoose and HTTP adapters, and wire them only in `src/main/app.ts`.
