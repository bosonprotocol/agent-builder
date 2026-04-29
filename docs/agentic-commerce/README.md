# @bosonprotocol/agentic-commerce

![tests](https://img.shields.io/badge/tests-995%2F1011%20passing-orange)
![coverage](https://img.shields.io/badge/coverage-58.9%25-orange)
![ESLint](https://img.shields.io/badge/ESLint-0%20warnings-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-passing-brightgreen)

MCP server, MCP client, and GOAT SDK plugin for [Boson Protocol](https://bosonprotocol.io) — the decentralized Agentic Commerce Protocol (dACP) that enables agents to securely buy and sell anything — digital or physical — with game-theoretic guarantees.

## 🤖 For AI Agents

**See [AGENTS.md](https://github.com/bosonprotocol/agent-builder/blob/HEAD/docs/agentic-commerce/AGENTS.md) for a comprehensive AI agent guide** covering end-to-end selling and buying flows, exchange lifecycle, configuration, and integration options. Claude Code auto-loads it via the `CLAUDE.md` → `@AGENTS.md` import.

**Hosted MCP servers (no setup required):**
- Staging: `https://mcp-staging.bosonprotocol.io/mcp`
- Production: `https://mcp.bosonprotocol.io/mcp`

## 📚 Documentation

- [AI Agent Guide](https://github.com/bosonprotocol/agent-builder/blob/HEAD/docs/agentic-commerce/AGENTS.md) — End-to-end flows, exchange & dispute lifecycles, enums, integration options
- [MCP Server README](https://github.com/bosonprotocol/agent-builder/blob/HEAD/docs/agentic-commerce/src/boson/mcp-server/README.md) — All 56 tools, 2 prompts, 10 resources with full parameter reference
- [MCP Client README](https://github.com/bosonprotocol/agent-builder/blob/HEAD/docs/agentic-commerce/src/boson/mcp-client/README.md) — TypeScript client usage
- [GOAT SDK Plugin README](https://github.com/bosonprotocol/agent-builder/blob/HEAD/docs/agentic-commerce/src/boson/goat-sdk-plugin/README.md) — Agent framework integration (Anthropic, Vercel AI)
- [High Value Asset Module README](https://github.com/bosonprotocol/agent-builder/blob/HEAD/docs/agentic-commerce/src/fermion/README.md) — High-value/luxury asset marketplace (formerly Fermion Protocol, integrated into Boson in 2025)
- [E2E Test Suite](https://github.com/bosonprotocol/agent-builder/blob/HEAD/docs/agentic-commerce/e2e/boson/tests/complete-marketplace-journeys.test.ts) — Runnable reference for every seller/buyer/dispute flow
- [Boson Protocol Docs](https://docs.bosonprotocol.io) — Protocol concepts and architecture
- [Agent Integration Docs](https://docs.bosonprotocol.io/using-the-protocol/agent-integration) — MCP + GOAT SDK guide on the protocol site

---

## 🧪 Development

```bash
# Install dependencies
pnpm i --frozen-lockfile

# Watch mode for development
pnpm watch

# Run each in a terminal:
pnpm dev:boson:http
pnpm dev:boson:http:inspector

# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Linting and type checking
pnpm lint
pnpm typecheck
```

## 📋 Environment Setup

1. Copy `mcpServer.example.json` to `mcpServer.json` if not automatically done
2. Update the args array to match the real path to the file to be run

## 📋 Requirements

- Node.js 23+
- Infura project ID and secret (check `.env.example`)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
