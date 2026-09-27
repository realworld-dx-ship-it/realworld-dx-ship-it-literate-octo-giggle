# CLAUDE.md

## Project Overview

LINE Messaging API integration service — a Node.js webhook server that receives messages from LINE and echoes them back to users. Built with Express.js and the official LINE Bot SDK.

## Tech Stack

- **Runtime:** Node.js >= 18.0.0 (CommonJS modules)
- **Framework:** Express.js 4.x
- **LINE SDK:** @line/bot-sdk 9.x
- **Linter:** ESLint 8.x (default config, no `.eslintrc` file)
- **Test runner:** Node.js built-in `node:test`

## Project Structure

```
src/
  index.js       # Express server, routes (/webhook, /health), LINE middleware
  handler.js     # LINE event handler (handleEvent) and reply builder (buildReply)
test/
  handler.test.js  # Unit tests for buildReply using node:test + node:assert/strict
.env.example     # Required env vars template
```

## Commands

```bash
npm start        # Start the server (node src/index.js)
npm run dev      # Start with file watching (node --watch src/index.js)
npm test         # Run tests (node --test test/**/*.test.js)
npm run lint     # Run ESLint on src/ and test/
```

## Environment Variables

Defined in `.env` (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `LINE_CHANNEL_SECRET` | LINE channel secret for webhook signature validation |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE channel access token for sending replies |
| `PORT` | Server port (default: 3000) |

**Never commit `.env` — it is gitignored.**

## Architecture

- `src/index.js` sets up Express, applies `line.middleware(config)` to the `/webhook` route for signature verification, and delegates event processing to `handleEvent`.
- `src/handler.js` exports `handleEvent(event, config)` which creates a `MessagingApiClient` per request and replies to text messages. `buildReply(text)` is a pure function extracted for testability.
- The app is exported as `{ app }` from `index.js` for potential integration testing. Server startup is guarded by `require.main === module`.

## Code Conventions

- **Module system:** CommonJS (`require` / `module.exports`). No ES modules.
- **Naming:** camelCase for functions and variables, camelCase filenames.
- **Style:** 2-space indentation, semicolons, double-quoted strings, arrow functions in callbacks.
- **Exports:** Named exports (e.g., `module.exports = { handleEvent, buildReply }`).
- **Error handling:** Promise chain with `.catch()` on the webhook route; errors logged to `console.error`.
- **Comments:** Minimal — code is self-documenting. Documentation lives in README.md.

## Testing Conventions

- Tests live in `test/` and use the `*.test.js` suffix.
- Use Node.js built-in `node:test` (`describe`, `it`) and `node:assert/strict`.
- Test pure functions directly; SDK-dependent code is not mocked.
- Run all tests: `npm test`.

## Key Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/webhook` | LINE webhook receiver (protected by LINE middleware) |
| GET | `/health` | Health check (returns `{ status: "ok" }`) |

## Before Submitting Changes

1. Run `npm test` — all tests must pass.
2. Run `npm run lint` — no lint errors.
3. Do not commit `.env` or secrets.
