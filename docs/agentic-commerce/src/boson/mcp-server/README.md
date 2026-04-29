# MCP Server

This directory contains the MCP server for the Boson Protocol. For a full end-to-end agent guide covering buying, selling, and exchange lifecycle, see the [AI Agent Guide](../../../AGENTS.md) at the repository root.

## Overview

The `BosonMCPServer` is a server-side application that exposes the functionality of the Boson Protocol through the Model Context Protocol (MCP). It acts as a gateway, allowing clients to interact with the protocol by calling a set of defined tools and resources.

### Key Features

- **Tool-Based Interface:** The server provides a comprehensive set of tools for interacting with the Boson Protocol, including creating offers, managing disputes, and querying data.
- **Request Handling:** It handles incoming requests from MCP clients, validates them, and routes them to the appropriate handlers.
- **Core SDK Integration:** The server uses the Boson Protocol Core SDK to interact with the underlying blockchain and smart contracts.
- **Resource Endpoints:** It exposes resource endpoints that allow clients to query data from the protocol.
- **Validation:** The server uses `zod` schemas to validate incoming requests and ensure data integrity.

## How it Works

The `BosonMCPServer` class initializes an MCP server and registers a set of tool handlers. Each tool handler is responsible for a specific action on the protocol, such as creating a seller or voiding an offer. When a client calls a tool, the server receives the request, validates the parameters, and then executes the corresponding handler.

The server also sets up resource endpoints for querying data. These endpoints use URI templates to define the structure of the resource URLs and allow for flexible filtering and pagination. There are some tools that do the same as their resource counterparty, if possible, choose the tool version as it's more flexible.

The server can be run in two modes: as a standalone HTTP server or as a stdio-based server. The HTTP server provides a web interface and a health check endpoint, while the stdio server is suitable for use in environments where a direct connection to the server is required.

## Interacting with the MCP Server

You can interact with the MCP server using the [MCP Inspector](https://www.npmjs.com/package/@modelcontextprotocol/inspector), a CLI and UI tool for exploring and testing MCP servers. This is useful for development, debugging, and learning about available tools and resources.

Example usage:

```sh
pnpm start:boson:http:inspector
# or, for development mode:
pnpm dev:boson:http:inspector
```

This will connect the Inspector to your running MCP server (in HTTP mode) and let you browse, call tools, and inspect responses interactively.

## Tools (Actions)

The MCP server exposes the following tools (actions) for interacting with the Boson Protocol:

- **Seller & Buyer Management**

  - `create_seller`: Create a new seller on Boson Protocol.
  - `update_seller`: Update an existing seller on Boson Protocol.
  - `create_buyer`: Create a new buyer on Boson Protocol.
  - `get_sellers`: Get seller entities with flexible query parameters including pagination, ordering, and filtering.
  - `get_sellers_by_address`: Get seller entities by address with flexible query parameters including pagination, ordering, and filtering.
  - `get_dispute_resolvers`: Get dispute resolver entities with flexible query parameters including pagination, ordering, and filtering.

- **Offer Management**

  - `create_offer`: Create a new offer on Boson Protocol. Tip: Consider storing metadata first using store_product_v1_metadata, store_bundle_metadata, or store_base_metadata tools to get URIs for the metadata fields.
  - `create_offer_with_condition`: Create a new offer with a specific condition on Boson Protocol. Tip: Consider storing metadata first using store_product_v1_metadata, store_bundle_metadata, or store_base_metadata tools to get URIs for the metadata fields.
  - `sign_full_offer`: Return the typed data message to sign from the offer data of a non-listed offer. The message must be signed by the offer creator and the signature passed to `create_offer_and_commit` (to create and commit in one step) or to `void_non_listed_offer` (to void the offer before it is listed).
  - `create_offer_and_commit`: Create and commit to a non-listed offer in one atomic step. Requires a signature previously obtained via `sign_full_offer`.
  - `void_offer`: Void an existing listed offer by calling the OfferHandlerFacet contract.
  - `void_non_listed_offer`: Void a non-listed offer. Useful if the offer creator changes their mind before listing. Requires a signature from `sign_full_offer`.
  - `void_non_listed_offer_batch`: Void a batch of non-listed offers in one transaction. Each offer requires a signature from `sign_full_offer`.
  - `get_offers`: Get offer entities with flexible query parameters including pagination, ordering, and filtering.
  - `get_all_products_with_not_voided_variants`: Get all products with not voided variants with flexible query parameters including pagination, ordering, and filtering.
  - `store_product_v1_metadata`: Store ProductV1 metadata to IPFS and return metadata URI and hash.
  - `store_bundle_metadata`: Store Bundle metadata to IPFS. You should call the `store_bundle_item_*` tools before calling this.
  - `store_base_metadata`: Store custom metadata to IPFS and return metadata URI and hash.
  - `store_bundle_item_product_v1_metadata`: Store Bundle Item ProductV1 metadata to IPFS, useful for store_bundle_metadata tool.
  - `store_bundle_item_nft_metadata`: Store Bundle Item NFT metadata to IPFS, useful for store_bundle_metadata tool.
  - `validate_metadata`: Validate metadata against the Boson Protocol schema without storing it to IPFS. Useful for checking metadata correctness before storage.
  - `render_contractual_agreement`: Render a contractual agreement using renderContractualAgreement from Boson Protocol SDK.

- **Exchange Management**

  - `get_exchanges`: Get exchange entities with flexible query parameters including pagination, ordering, and filtering.
  - `approve_exchange_token`: Grant ERC-20 allowance to the Boson Protocol contract. Must be called before `commit_to_offer` or `deposit_funds` when the offer uses a non-native (ERC-20) exchange token.
  - `commit_to_offer`: Commit to a seller-created offer to create an exchange. For ERC-20 offers, call `approve_exchange_token` first.
  - `commit_to_buyer_offer`: Commit to a buyer-initiated offer to create an exchange (seller side).
  - `complete_exchange`: Complete an exchange after voucher redemption.
  - `cancel_voucher`: Cancel an existing voucher by buyer.
  - `revoke_voucher`: Revoke an existing voucher by seller assistant.
  - `redeem_voucher`: Redeem an existing voucher by buyer.

- **Dispute Management**

  - `raise_dispute`: Raise a dispute for an exchange.
  - `resolve_dispute`: Resolve a dispute with mutual agreement.
  - `retract_dispute`: Retract a previously raised dispute.
  - `escalate_dispute`: Escalate a dispute to the dispute resolver.
  - `decide_dispute`: Decide an escalated dispute (dispute resolver only).
  - `refuse_escalated_dispute`: Refuse an escalated dispute (dispute resolver only).
  - `expire_dispute`: Expire a dispute.
  - `expire_dispute_batch`: Expire multiple disputes in a batch.
  - `expire_escalated_dispute`: Expire an escalated dispute.
  - `extend_dispute_timeout`: Extend the timeout for a dispute.
  - `get_disputes`: Get dispute entities with flexible query parameters including pagination, ordering, and filtering.
  - `get_dispute_by_id`: Get a specific dispute by ID with optional query variables.
  - `create_dispute_resolution_proposal`: Create a dispute resolution proposal signature.

- **Funds Management**

  - `deposit_funds`: Deposit funds to an entity treasury.
  - `withdraw_funds`: Withdraw funds from an entity treasury.
  - `get_funds`: Get funds entities with flexible query parameters including pagination, ordering, and filtering.

- **Meta Transactions**

  - `send_meta_transaction`: Send a meta transaction using Boson Protocol SDK.
  - `send_native_meta_transaction`: Send a native meta transaction using Boson Protocol SDK.
  - `send_forwarded_meta_transaction`: Send a forwarded meta transaction using Boson Protocol SDK.

- **Transaction Sending**

  - `send_signed_transaction`: Broadcasts a transaction signed locally with your wallet (e.g. ethers `wallet.signTransaction(tx)`) to the Ethereum network. Signing is done in your own infrastructure — the server never receives private keys.

- **Agent Registry**

  - `register_agent`: Register a dACP agent with the MCP server. Validates the agent definition against the dACP registry schema and opens a GitHub pull request to add the agent to the registry.
  - `get_registered_agents`: Get all dACP agents currently registered with the MCP server.

- **Configuration**
  - `get_config_ids`: Get the list of supported config IDs for this MCP server.
  - `get_supported_tokens`: Get the list of supported exchange tokens for the given configId.

## Resources

The server exposes resource endpoints for querying protocol data. Each resource supports filtering, ordering, and pagination:

- `offers://entities` — Query offers
- `products://entities` — Query products
- `exchanges://entities` — Query exchanges
- `disputes://entities` — Query disputes
- `funds://entities` — Query funds
- `sellers://entities` — Query sellers
- `sellers-by-address://entities` — Query sellers by address
- `dispute-resolvers://entities` — Query dispute resolvers
- `config://ids` — Query supported config IDs
- `registered-agents://` — List all dACP agents registered with this server

Each resource supports specific filter parameters (see code for details).

## Prompts

The server exposes MCP prompts that guide an AI agent through multi-step workflows:

- `create-seller-if-needed`: Create a seller if one does not already exist for the given `signerAddress`, returning the `sellerId`. Requires `configId` and `signerAddress` parameters.
- `create-offer`: Create an offer on Boson Protocol for the given `configId` and `signerAddress` (seller). Tips for metadata storage and seller creation are included in the prompt. Requires `configId` and `signerAddress` parameters.

## Transaction Signing Pattern

Every state-changing tool returns **unsigned transaction data** — it does not execute automatically. The caller is responsible for signing and broadcasting. The 3-step pattern:

```
1. Call tool                  → returns { unsignedTx: { to, data, ... } }
2. Sign locally with wallet   → e.g. ethers `wallet.signTransaction(tx)` returns "0x..."
3. send_signed_transaction    → returns { txHash, blockNumber, ... }
```

The `signerAddress` parameter on every write tool specifies which Ethereum account is performing the action (authorization check). The MCP server never receives private keys — all signing happens locally in your own infrastructure.

## Exchange Lifecycle

```
[Listed Offer]
     │
     ▼ commit_to_offer (buyer)
  COMMITTED ──── revoke_voucher (seller) ──► REVOKED
     │
     ├── cancel_voucher (buyer) ───────────► CANCELLED
     │
     ▼ redeem_voucher (buyer)
  REDEEMED ───── complete_exchange ──────► COMPLETED
     │
     └── raise_dispute (buyer)
           │
        DISPUTED ── retract_dispute ─────► RETRACTED
           │
           ├── resolve_dispute (mutual) ─► RESOLVED
           │
           └── escalate_dispute (buyer)
                 │
              ESCALATED ── decide_dispute (DR) ──► DECIDED
                 │
                 ├── refuse_escalated_dispute ────► REFUSED
                 └── resolve_dispute (mutual) ────► RESOLVED
```

## Seller Quick-Start Flow

1. Call `get_sellers_by_address` — check if you already have a seller account
2. If not: `create_seller` → sign → `send_signed_transaction` → extract `sellerId` from logs
3. `store_product_v1_metadata` → get `metadataUri` + `metadataHash`
4. `create_offer` (with metadata URI/hash) → sign → `send_signed_transaction` → extract `offerId`
5. Monitor: `get_exchanges` with `sellerId` filter
6. Withdraw: `withdraw_funds` after exchanges complete

## Buyer Quick-Start Flow

1. `get_offers` or `get_all_products_with_not_voided_variants` — browse listings
2. If ERC-20 offer: `approve_exchange_token` → sign → `send_signed_transaction`
3. `commit_to_offer` → sign → `send_signed_transaction` → extract `exchangeId`
4. `redeem_voucher` → sign → `send_signed_transaction` (starts dispute period)
5. If issue: `raise_dispute` (within dispute period)
6. `complete_exchange` — after redemption + dispute period (or call early to release funds)

## Hosted MCP Endpoints

No local setup required for connecting to Boson's hosted servers:

- **Staging:** `https://mcp-staging.bosonprotocol.io/mcp`
- **Production:** `https://mcp.bosonprotocol.io/mcp`

## How to Run

First, build the project:

```sh
pnpm build
```

Then, you can run the MCP server in different modes:

### HTTP Server Mode

```sh
pnpm start:boson:http
```

This starts the server with HTTP endpoints and a health check.

### Stdio Server Mode

```sh
pnpm start:boson
```

This starts the server in stdio mode (for direct integration with MCP Inspector or other tools).

### Development Mode

```sh
pnpm dev:boson:http
```

or

```sh
pnpm dev:boson
```

These commands start the server in watch mode for development.

### Configuration

The server uses `mcpServer.json` for configuration. You can copy and modify `mcpServer.example.json` as needed.

Otherwise run this command to create your `mcpServer.json`:

```sh
pnpm setup-mcp-server
```

#### Note on `CONFIG_IDS` and `configId`

All read-only tools and resources require a `configId` parameter. This value must match one of the IDs set in the `CONFIG_IDS` environment variable (see `.env` or `.env.example`) or in your `mcpServer.json`, depending on how you run the server. If you call a read-only tool/resource, you must provide a valid configId (e.g. `local-31337-0`, `staging-80002-0`, `production-137-0`, etc.).

##### Example CONFIG_IDS values for different deployments:

- **Local development:**
  ```env
  CONFIG_IDS=local-31337-0
  ```
- **Testing (Amoy, Base, Sepolia, etc):**
  ```env
  CONFIG_IDS=testing-80002-0,testing-84532-0,testing-11155111-0,testing-11155420-0,testing-421614-0
  ```
- **Staging:**
  ```env
  CONFIG_IDS=staging-80002-0,staging-84532-0,staging-11155111-0,staging-11155420-0,staging-421614-0
  ```
- **Production:**
  ```env
  CONFIG_IDS=production-137-0,production-42161-0,production-8453-0,production-10-0,production-1-0
  ```

For non read-only tools (i.e., those that perform write or state-changing actions), you must also pass a `signerAddress` (an Ethereum address) along with the `configId` parameter. These tools do not sign actions themselves—instead, they return the data you need to sign locally on your side (for example, using your wallet or signing infrastructure). The MCP server never receives private keys.

---

For more details on each tool and resource, see the handler and filter files in this directory.
