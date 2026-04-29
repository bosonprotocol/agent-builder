# Create a High Value Asset Module MCP-Client

> **Note:** "Fermion" is no longer used as a brand. The former Fermion Protocol was integrated into the Boson codebase in 2025 and is now the **High Value Asset Module** of Boson Protocol. The directory name `fermion/`, service names, and SDK package names are retained for code-level compatibility.

The following documentation describes how to create an MCP client to connect an AI Agent to the High Value Asset Module's MCP server.

In this example, the AI Agent using the MCP client will be able to use the module's MCP server to act as a Seller on the High Value Asset Module, create an offer, mint and list tokens (FNFTs), and so on (see the module's Seller flow).

## Prerequisite

Make sure:
- you have a functional Local Environment running (see [setup-local-env](./setup-local-env.md))

## Create an mcp-client

Creating an MCP client is straightforward using the typescript_sdk and the example given in their GitHub repo (See [MCP typescript_sdk](https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#writing-mcp-clients)).

The Client needs to connect using Streamable HTTP (as it's the transport type activated on the MCP-Server container), via the URL "http://localhost:3000/mcp".

Other SDKs are also available in different languages (Python, Java, Kotlin, C#). See [modelcontextprotocol](https://github.com/modelcontextprotocol).

An example is given in [./example/create-mcp-client.ts](./example/create-mcp-client.ts)
