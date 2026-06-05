# 💬 XMTP + Boson MCP Integration

This project demonstrates how to interact with the Boson MCP Server plugin and send messages through XMTP (Extensible Message Transport Protocol). It combines blockchain wallet operations with AI-driven tooling and decentralized messaging, allowing supported AI models to call tools for on-chain actions and peer-to-peer communication.

---

## Configure Environment Variables

Copy the example environment file and fill in your secrets:
You'll need to set:

- `PRIVATE_KEY` → Your blockchain wallet private key (for Boson MCP tools). In
  stdio mode this key is also handed to the local XMTP MCP server.
- `ANTHROPIC_API_KEY` → API key from Anthropic Console.
- `BOSON_MCP_URL` → MCP server endpoint (staging or production).
- `CHAIN_ID` → Chain ID matching chainId from configId.
- `XMTP_BOSON_MCP_URL` → _Optional._ URL of **your own** self-hosted XMTP MCP
  HTTP server. Leave it unset to run the server locally over stdio (the default).

---

## 🚀 Deploy the XMTP MCP Server

As of [chat-sdk #103](https://github.com/bosonprotocol/chat-sdk/pull/103) the
XMTP MCP server is **no longer publicly hosted** — you must run it yourself. The
server acts on behalf of a wallet and needs its private key, so never expose it
to unauthenticated access or point clients at a shared/public instance.

There are two ways to run it:

### Stdio (default, recommended)

Nothing extra to configure. Leave `XMTP_BOSON_MCP_URL` **unset** and the example
spawns the server as a local subprocess via `npx boson-xmtp-mcp-server`, passing
your `PRIVATE_KEY` to it as `BOSON_XMTP_PRIVATE_KEY` automatically.

The `boson-xmtp-mcp-server` binary (and the Playwright browsers it needs at
runtime) ship with `@bosonprotocol/chat-sdk`, which is already installed as a
dependency of this repo — so no separate install is required.

### HTTP (optional, self-hosted)

Run your own long-running server, bound to localhost, with the wallet key
supplied as a secret in its environment:

```bash
BOSON_XMTP_PRIVATE_KEY=<your_wallet_private_key> npx boson-xmtp-mcp-server --http
```

You can also run it via the `docker-compose.yml` shipped in the chat-sdk repo.
Then point this example at your private URL:

```env
XMTP_BOSON_MCP_URL=http://127.0.0.1:3000/mcp
```

See chat-sdk's
[docs/mcp-self-hosting.md](https://github.com/bosonprotocol/chat-sdk/blob/v2.0.0/docs/mcp-self-hosting.md)
and
[SECURITY.md](https://github.com/bosonprotocol/chat-sdk/blob/v2.0.0/SECURITY.md)
for the authoritative run instructions and security guidance.

---

## ▶️ Running the Project

Start the interactive AI agent:
This will:

Connect to the Boson MCP server with your wallet by loading its tools.
Load the XMTP messaging tools from the XMTP MCP server.
Allow you to enter prompts and watch the tools being called automatically.

## 🛠 Available Tools

Boson MCP Tools → On-chain commerce operations.
XMTP Messaging Tools → Send decentralized messages via XMTP protocol.
