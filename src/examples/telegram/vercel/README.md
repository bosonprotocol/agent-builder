# Claude AI Telegram Bot with Boson Protocol Integration

A Telegram bot powered by Claude AI that integrates with the Boson Protocol MCP server, enabling users to interact with decentralized commerce tools directly through Telegram chat.

## Overview

This bot combines the conversational capabilities of Claude AI with the decentralized commerce functionality of Boson Protocol, allowing users to perform blockchain operations, manage wallets, and execute commerce transactions through a simple Telegram interface.

## Features

- **Claude AI Integration**: Full conversational AI capabilities powered by Claude Sonnet 4
- **Multi-Chain Support**: Automatic tool initialization across multiple blockchain networks
- **Wallet Management**: Secure in-memory private key storage with multi-chain support
- **Boson Protocol Tools**: Full access to decentralized commerce functionality
- **Dynamic Tool Loading**: Chain-specific tools loaded on-demand for optimal performance
- **Security-First**: Private keys stored in memory only, never persisted to disk
- **User Context**: Maintains conversation history and context per user

## Architecture

### Key Components

- **Telegram Bot**: Built with grammy framework for robust message handling
- **Claude AI**: Uses Anthropic's AI SDK for intelligent responses
- **Wallet Management**: Per-user wallet storage with multi-chain tool caching
- **MCP Integration**: Connects to Boson Protocol's MCP server via GOAT SDK
- **Dynamic Tool Resolution**: Automatically initializes blockchain tools per configuration

### Supported Networks

The bot automatically detects and supports all networks available through the Boson Protocol MCP server, including:

- Polygon Amoy (testnet)
- Base Sepolia (testnet)
- And other EVM-compatible chains as configured

## Setup

### Prerequisites

1. Node.js 23+
2. Telegram Bot Token (from [@BotFather](https://t.me/botfather))
3. Anthropic API Key
4. Access to Boson Protocol MCP server

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm ci
```

### Environment Configuration

Create a `.env` file in the example folder:

```env
# Required
TG_BOT_TOKEN=your_telegram_bot_token_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional - MCP server configuration
BOSON_MCP_URL=https://mcp-staging.bosonprotocol.io/mcp

# Optional - Environment mode
NODE_ENV=development
```

### Getting API Keys

1. **Telegram Bot Token**:
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command and follow instructions
   - Copy the provided bot token

2. **Anthropic API Key**:
   - Sign up at [Anthropic Console](https://console.anthropic.com/)
   - Create an API key in your dashboard
   - Ensure you have sufficient credits/quota

## Usage

### Starting the Bot

```bash
# In the root folder:
npm run watch

# Start the bot in the telegram/vercel folder
npm start

# Or with environment variables inline
TG_BOT_TOKEN=your_token ANTHROPIC_API_KEY=your_key npm start
```

### Bot Commands

#### Setup Commands

- `/start` - Welcome message and bot introduction
- `/help` - Show available commands and examples
- `/wallet` - Set up your private key for blockchain operations
- `/wallet_status` - Check your wallet status and balances
- `/chains` - View supported blockchain configurations
- `/remove_wallet` - Securely remove your wallet from memory
- `/clear` - Clear your conversation history

#### Usage Examples

**General AI Chat:**

```
User: Explain how blockchain works
Bot: [Claude AI provides detailed explanation]
```

**Blockchain Operations:**

```
User: Check my wallet balance
Bot: [Shows balances across all supported chains]
```

**Commerce Operations:**

```
User: Help me create an offer on Boson Protocol
Bot: [Guides through offer creation process using MCP tools]
```

## Security Features

### Private Key Management

- **Memory Only**: Private keys stored exclusively in memory, never written to disk
- **Session Based**: Keys automatically cleared when bot restarts
- **Manual Removal**: `/remove_wallet` command for immediate key deletion
- **Message Deletion**: Private key messages automatically deleted from chat

### Best Practices

- Use test wallets only, never main wallets with significant funds
- Regularly use `/remove_wallet` when operations are complete
- Monitor wallet activity through `/wallet_status`
- Keep bot token and API keys secure

## INTERACTION WITH BOSON PROTOCOL

Boson Protocol is the Decentralized Commerce Protocol on EVM blockchains (Ethereum, Polygon, Base, Optimism, Arbitrum and testnets).

### Available Operations

- Create entities (seller, buyer, dispute resolver)
- Create and manage offers
- Commit to offers
- Redeem exchanges
- Raise disputes
- And more commerce operations

### Transaction Flow

When interacting with Boson Protocol, the bot follows this flow:

1. Call the specific MCP tool for the requested action
2. Receive transaction data with "to" and "data" fields
3. Sign the transaction with the user's wallet
4. Send the signed transaction to the network
5. Wait for confirmation and protocol data updates

## Advanced Features

### Multi-Chain Tool Management

- Tools are initialized on-demand per blockchain network
- Automatic configuration detection from MCP server
- Cached tools for improved performance
- Seamless switching between different chains

### Dynamic Configuration Resolution

The bot includes a `resolveToolForConfig` function that:

- Validates requested configuration IDs
- Initializes chain-specific tools when needed
- Provides seamless multi-chain operation

### Context Management

- Maintains conversation history per user
- Automatic context trimming to prevent memory issues
- Smart message splitting for long responses

## Error Handling

### Common Error Scenarios

- **Invalid Private Key**: Clear format validation and user guidance
- **Unsupported Chain**: Automatic fallback and error messaging
- **Transaction Failures**: Detailed error reporting from blockchain
- **MCP Connection Issues**: Graceful degradation to basic AI functionality

### Security Error Handling

- Automatic private key message deletion
- Secure error logging (no sensitive data in logs)
- Graceful shutdown procedures

## Troubleshooting

### Common Issues

1. **Bot Not Responding**
   - Verify `TG_BOT_TOKEN` is correct
   - Check bot is properly started with BotFather
   - Ensure network connectivity

2. **Claude AI Errors**
   - Verify `ANTHROPIC_API_KEY` is valid
   - Check API quota and billing status
   - Try with a simpler message first

3. **Wallet Issues**
   - Ensure private key format is correct (64 hex characters)
   - Try removing and re-adding wallet
   - Check supported networks with `/chains`

4. **MCP Connection Problems**
   - Verify `BOSON_MCP_URL` accessibility
   - Check MCP server status
   - Try with staging environment first

5. **Transaction Failures**
   - Ensure sufficient balance for gas fees
   - Verify network isn't congested
   - Check transaction parameters
