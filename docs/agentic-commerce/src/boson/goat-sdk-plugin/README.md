# GOAT SDK Plugin

This directory contains the GOAT SDK plugin for the Boson Protocol.

## Overview

The `BosonProtocolPlugin` provides a seamless integration with the GOAT SDK, allowing developers to interact with the Boson Protocol through a simple and intuitive interface. It abstracts away the complexity of the underlying MCP server communication, enabling developers to focus on building their applications.

### Key Features

- **Offer Management:** Create, void, and manage offers on the Boson Protocol.
- **Dispute Resolution:** Handle disputes, including raising, retracting, and escalating them.
- **Fund Management:** Deposit and withdraw funds from the protocol.
- **Data Queries:** Retrieve information about offers, exchanges, sellers, and disputes.
- **Metadata Storage:** Store various types of metadata on IPFS.

## How it Works

The plugin consists of two main components:

- **`BosonProtocolPlugin`:** The main entry point for the plugin, which registers the available tools with the GOAT SDK.
- **`BosonProtocolPluginService`:** A service that handles the direct communication with the MCP server via the MCP client, including sending requests, parsing responses, and executing transactions.

The plugin leverages the `@goat-sdk/core` and `@goat-sdk/wallet-evm` packages to provide a consistent and reliable experience for developers. It also uses `zod` for robust validation of MCP responses and transaction data.

## How to use

To get started with the Boson Protocol MCP server plugin:

- **Check out the example files in the `examples` folder** for practical usage patterns, including how to use the plugin in your own application.
- The example files import local modules (e.g. `import { bosonProtocolPlugin } from "../boson-protocol.plugin"`), but when developing your own application you should import from the published npm package:

  ```ts
  import { bosonProtocolPlugin } from "@bosonprotocol/agentic-commerce";
  ```

- By default, the examples connect to a local MCP server (e.g. `http://localhost:3000/mcp`). If you want to use a deployed instance, **replace the URL in the examples with one of the following**:

  - **Staging:** `https://mcp-staging.bosonprotocol.io/mcp`
  - **Production:** `https://mcp.bosonprotocol.io/mcp`

---
