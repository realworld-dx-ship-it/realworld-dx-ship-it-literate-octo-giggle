# LINE Integration

A LINE Messaging API integration service built with Node.js and Express.

## Prerequisites

- Node.js >= 18
- A [LINE Developers](https://developers.line.biz/) account with a Messaging API channel

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your LINE channel credentials:

```bash
cp .env.example .env
```

3. Start the server:

```bash
npm start
```

## Development

```bash
npm run dev   # start with file watching
npm test      # run tests
npm run lint  # run linter
```

## Webhook

Configure your LINE channel webhook URL to point to:

```
https://your-domain.com/webhook
```

## Project Structure

```
src/
  index.js    - Express server and webhook endpoint
  handler.js  - LINE event handler and reply logic
test/
  handler.test.js - Unit tests for handler
```
