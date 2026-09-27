# CLAUDE.md

## Project Overview

A LINE Messaging API webhook integration service built with Node.js and Express. It receives messages from LINE users and echoes them back. Intentionally minimal — a starter template or production-ready micro-service for LINE bot development.

## Tech Stack

- **Runtime:** Node.js >= 18.0.0
- **HTTP framework:** Express 4.x
- **LINE SDK:** `@line/bot-sdk` 9.x (webhook middleware + MessagingApiClient)
- **Testing:** Node.js native test runner (`node:test`, `node:assert/strict`) — no Jest or Mocha
- **Linting:** ESLint 8.x
- **Language:** CommonJS JavaScript (no TypeScript, no transpilation)

## Project Structure

```
.
├── src/
│   ├── index.js       # Express server, webhook endpoint, health check
│   └── handler.js     # LINE event processing and reply construction
├── test/
│   └── handler.test.js # Unit tests (handler business logic only)
├── .env.example        # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

## Development Workflow

```bash
npm install       # install dependencies
cp .env.example .env  # then fill in real credentials
npm run dev       # start with --watch (auto-restart on file change)
npm test          # run all tests
npm run lint      # run ESLint over src/ and test/
npm start         # production start
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LINE_CHANNEL_SECRET` | Yes | LINE channel secret for webhook signature validation |
| `LINE_CHANNEL_ACCESS_TOKEN` | Yes | LINE channel access token for sending replies |
| `PORT` | No | HTTP port (defaults to 3000) |

Never commit `.env`. The `.gitignore` already excludes it.

## Architecture

### Request flow

```
LINE Platform → POST /webhook
  → line.middleware(config)   # validates signature, parses body
  → handleEvent(event, config) per event (Promise.all)
  → buildReply(text)
  → client.replyMessage(...)
```

### Module responsibilities

**`src/index.js`** — infrastructure only: Express setup, middleware wiring, endpoint routing, server startup. Exports `app` for potential programmatic use.

**`src/handler.js`** — business logic only: `handleEvent` (async, talks to LINE API) and `buildReply` (pure function, builds message object from text string). Keep these two concerns separate.

### Key patterns

- `handleEvent` creates a fresh `MessagingApiClient` per invocation using the passed config. No global client singleton.
- Non-text events are silently ignored (return `null`).
- The server only starts (`app.listen`) when `require.main === module`, allowing the module to be imported in tests without binding a port.
- Errors in webhook processing are caught, logged via `console.error`, and return HTTP 500.

## Testing Conventions

- Tests live in `test/` with the suffix `.test.js`.
- Use Node.js native `node:test` and `node:assert/strict` — do not introduce Jest or Mocha.
- Only unit-test pure/isolated logic (e.g. `buildReply`). HTTP-level integration tests are out of scope for this project.
- Run with: `node --test test/**/*.test.js`

## Extending the Service

When adding new event types or reply logic:
1. Add the logic to `src/handler.js` (keep `src/index.js` unchanged if possible).
2. Write unit tests for any new pure functions in `test/handler.test.js`.
3. Keep `handleEvent` focused on dispatch; extract new reply builders as named functions alongside `buildReply`.

When adding new endpoints:
1. Define them in `src/index.js`.
2. Extract non-trivial handler logic into a dedicated module under `src/`.

## Linting

ESLint is configured for `src/` and `test/`. Run `npm run lint` before committing. No Prettier is configured; match surrounding code style (2-space indent, double quotes in `require`, semicolons).

## Deployment

The service expects to run behind a reverse proxy that terminates TLS. Configure the LINE Developer Console webhook URL to your public HTTPS endpoint:

```
https://your-domain.com/webhook
```

The `/health` endpoint (`GET /health → {"status":"ok"}`) can be used for load balancer or uptime health checks.
