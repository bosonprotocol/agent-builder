# High Value Asset Module MCP Server

![Tests](https://img.shields.io/badge/tests-50%2F50%20passing-brightgreen)

> **Note:** "Fermion" is no longer used as a brand. The former Fermion Protocol was integrated into the Boson codebase in 2025 and is now the **High Value Asset Module** of Boson Protocol. The `fermion` directory name, `@fermionprotocol/*` package imports, and `fermion` script aliases are retained for code-level compatibility.

An MCP (Model Context Protocol) server that integrates with the High Value Asset Module's core-components to enable AI agents to create offers on Boson's high-value/luxury asset marketplace with advanced features and verification systems.

## 🚀 Overview

The High Value Asset Module (formerly Fermion Protocol) is a Boson Protocol marketplace layer that adds verifier and custodian roles, enhanced verification systems, custodian services, and advanced royalty mechanisms on top of Boson's primitives. This MCP server provides AI agents with the ability to interact with that module.

## 🛠️ Installation

```bash
pnpm install
pnpm build
pnpm start:fermion
```

and open http://127.0.0.1:6274/ in your web browser

## 🧪 Development

```bash
pnpm install
pnpm watch
pnpm dev:fermion
```

and open http://127.0.0.1:6274/ in your web browser

## 🔧 Environment Setup

1. Copy `mcpServer.example.json` to `mcpServer.json` if not automatically done
2. Fill in your INFURA_IPFS_PROJECT_ID and INFURA_IPFS_PROJECT_SECRET
3. Change CONFIG_ID if needed
4. Set SIGNER_ADDRESS to your Ethereum address

## 🤖 Usage with AI Agents

Add the High Value Asset Module server to your MCP configuration:

```json
{
  "mcpServers": {
    "fermion-server": {
      "command": "node",
      "args": [
        "/Users/<user>/Documents/boson-protocol-mcp-server/dist/fermion/index.js"
      ],
      "env": {}
    }
  }
}
```

## 🔨 Available Tools

### `initialize_sdk`

Manually initialize the High Value Asset Module SDK with custom configuration.

**Parameters:**

- `signerAddress` (optional): Ethereum address of the signer (defaults to SIGNER_ADDRESS env var)
- `configId` (optional): Configuration ID (defaults to CONFIG_ID env var)
- `infuraIpfsProjectId` (optional): Infura IPFS project ID
- `infuraIpfsProjectSecret` (optional): Infura IPFS project secret

### `create_offer`

Creates a new offer on the High Value Asset Module with advanced features and verification systems.

**Parameters:**

- `productTitle` (required): Title of the product
- `productDescription` (required): Description of the product
- `productCategory` (required): Category of the product
- `sellerId` (required): Seller ID in the protocol
- `sellerDeposit` (required): Seller deposit in wei as string
- `verifierId` (required): Verifier ID for product verification
- `verifierFee` (required): Verifier fee in wei as string
- `custodianId` (required): Custodian ID for custody services
- `custodianFee` (required): Custodian fee object with amount and period
- `facilitatorId` (required): Facilitator ID
- `facilitatorFeePercent` (required): Facilitator fee percentage
- `exchangeToken` (required): Token address for payments
- `withPhygital` (optional): Whether the product includes physical components
- `royaltyInfo` (optional): Royalty information with recipients and BPS

### `send_signed_transaction`

Send a signed transaction to the Ethereum network.

**Parameters:**

- `signedTransaction` (required): The signed transaction data as hex string

### `generate_asset_verification_email`

Generate email parameters for asset verification delivery arrangement.

**Parameters:**

- `tokenId` (required): The fNFT token ID to generate verification email for
- `ipfsGateway` (optional): Custom IPFS gateway URL (defaults to IPFS_GATEWAY env var or Boson Protocol's Infura IPFS gateway)

## 🔗 Links

- [Boson Protocol Website](https://www.bosonprotocol.io/)
- [Boson Protocol Documentation](https://docs.bosonprotocol.io)

### Legacy Fermion Protocol references

These external resources predate the 2025 integration into Boson but are retained because the published packages, images, and contracts are still named `fermion*`:

- [Fermion Protocol Website (legacy)](https://fermionprotocol.io)
- [Fermion Protocol Documentation (legacy)](https://docs.fermionprotocol.io)
- [Fermion Protocol GitHub (legacy)](https://github.com/fermionprotocol)
- [Fermion Protocol Core Components (legacy)](https://github.com/fermionprotocol/core-components)

## 🏗️ Architecture

The High Value Asset Module MCP server is structured as follows:

```
src/fermion/
├── index.ts              # Main server entry point
├── schemas.ts            # Zod validation schemas
├── validation.ts         # Input validation logic
└── handlers/
    ├── sdk.ts           # SDK initialization handler
    ├── offers.ts        # Advanced offer creation handler
    └── transactions.ts  # Transaction handling
```
