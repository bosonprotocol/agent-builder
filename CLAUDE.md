# Agent Builder

Boson Protocol agent-builder — TypeScript monorepo of AI agent examples using `@bosonprotocol/agentic-commerce` SDK.

## Package manager
npm (volta-pinned: node 23.11.1, npm 11.5.2). Do NOT use pnpm or yarn.

## Build
`npm run watch` — cleans dist/, then runs tsc in watch mode
`npm run lint` / `npm run lint:fix` — ESLint with strict settings

## Workspaces (examples)
- `src/examples/standalone/vercel` — start: `npm run start:standalone-vercel`
- `src/examples/standalone/langchain` — start: `npm run start:standalone-langchain`
- `src/examples/telegram/vercel` — start: `npm run start:telegram-bot-vercel`
- `src/examples/email` — start: `npm run start:email`
- `src/examples/xmtp` — start: `npm run start:xmtp`

## Shared code
`src/common/` — shared utilities imported via `#common/*` path alias (maps to `dist/common/*`)

## No tests
No test suite configured — verify by running examples directly.

## Key dependencies
- `@bosonprotocol/agentic-commerce` — core Boson Protocol agent SDK
- `@bosonprotocol/chat-sdk` — chat integration
- `grammy` — Telegram bot framework
