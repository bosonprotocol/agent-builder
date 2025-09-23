# 💬 XMTP + Boson MCP Integration

This project demonstrates how to interact with the Boson MCP Server plugin and send messages through XMTP (Extensible Message Transport Protocol). It combines blockchain wallet operations with AI-driven tooling and decentralized messaging, allowing supported AI models to call tools for on-chain actions and peer-to-peer communication.

---

## Configure Environment Variables

Copy the example environment file and fill in your secrets:
You'll need to set:

- `PRIVATE_KEY` → Your blockchain wallet private key (for Boson MCP tools).
- `ANTHROPIC_API_KEY` → API key from Anthropic Console.
- `BOSON_MCP_URL` → MCP server endpoint (staging or production).
- `CHAIN_ID` → Chain ID matching chainId from configId.
- `XMTP_BOSON_MCP_URL` → XMTP MCP server endpoint.

👉 **XMTP Environment Setup**:
The system validates your XMTP MCP URL environment:

Production: Must include "production" in the URL
Staging: Must include "staging" in the URL
Testing: https://chat-sdk-408914412794.europe-west1.run.app/mcp
Local: URLs containing "localhost" or "127.0.0.1"

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
