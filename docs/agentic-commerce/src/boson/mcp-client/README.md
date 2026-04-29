# MCP Client

This directory contains the MCP client for the Boson Protocol.

## Overview

The `BosonMCPClient` is a client-side library that simplifies interaction with the Boson Protocol MCP server. It provides a high-level API that abstracts away the details of the MCP communication protocol, allowing developers to easily integrate Boson Protocol functionality into their applications.

### Key Features

- **Tool-Based Interaction:** The client exposes methods that directly correspond to the tools available on the MCP server, providing a clear and intuitive way to perform actions on the protocol.
- **Parameter Validation:** It uses `zod` schemas to validate the parameters for each tool, ensuring that requests are correctly formatted and reducing the likelihood of errors.
- **Resource Access:** The client provides methods for reading resources from the protocol, such as funds, disputes, exchanges, offers, and sellers.
- **Simplified Metadata Storage:** It includes helper methods for storing metadata on IPFS, automatically handling the creation of fair exchange policies.

## How it Works

The `BosonMCPClient` extends the `BaseMCPClient` and implements methods for each of the tools available on the Boson Protocol MCP server. When a method is called, the client constructs a tool call request with the specified parameters and sends it to the MCP server. It then returns the server's response, which can be used to execute transactions or retrieve data.

The client also includes client-side validation schemas that ensure the correctness of the data before it is sent to the server. This helps to prevent errors and provides a better developer experience.

## Installation & Setup

To use the MCP client in your own project:

1. **Installation:**

   ```sh
   pnpm add @bosonprotocol/agentic-commerce
   ```

2. **Import and use the client:**
   ```ts
   import { BosonMCPClient } from "@bosonprotocol/agentic-commerce";
   const client = new BosonMCPClient();
   // Example: await client.getOffers({ ...params })
   ```

## Usage

The `BosonMCPClient` exposes async methods that correspond 1:1 to the tools and resources available on the MCP server. All tool names and parameters match the server exactly (see the server README for the full list).

**Example:**

```ts
const offers = await client.getOffers({ ...params });
const funds = await client.readFunds({ ...params });
```

### Available Methods

- All server tools (e.g. `create_seller`, `create_offer`, `void_offer`, `get_funds`, etc.) are available as camelCase methods (e.g. `createSeller`, `createOffer`, `voidOffer`, `getFunds`, ...).
- All server resources (e.g. `funds`, `offers`, `exchanges`, etc.) are available as `readX` methods (e.g. `readFunds`, `readOffers`, ...).
- All parameters are validated with `zod` schemas before sending.

See the source code for the full list of methods and their signatures.

## Running Tests

To run the unit tests for the MCP client in this repository:

```sh
pnpm test src/boson/mcp-client/
```

## Development Notes

- The client is designed to be used with a running MCP server (see the server README for setup).
- There are read-only tools that perform the same function as their corresponding resources. If you're unsure which one to use, default to the tool version (e.g. use the `getFunds` function instead of the `readFunds` function).

---

For more details, see the code in this directory and the Boson Protocol documentation.
