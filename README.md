# Agent Builder

A collection of AI agents and examples that integrate with Boson Protocol for decentralized commerce operations. This repository provides various implementations and patterns for building intelligent agents that can interact with blockchain networks and perform commerce-related tasks.

## Overview

Agent Builder is a comprehensive toolkit for creating AI-powered agents that integrate with Boson Protocol's decentralized commerce infrastructure. It includes multiple example implementations across different platforms and communication channels, demonstrating how to build agents that can handle wallet management, blockchain transactions, and commerce operations.

## Features

- **Multiple AI Integrations**: Support for Claude AI, LangChain, and other AI frameworks
- **Multi-Platform Examples**: Telegram bots, email agents, XMTP messaging, and standalone applications
- **Blockchain Integration**: Full Boson Protocol MCP server integration with multi-chain support
- **Wallet Management**: Secure private key handling and transaction signing
- **Commerce Operations**: Complete decentralized commerce functionality
- **TypeScript Support**: Fully typed codebase with modern development tooling

## Architecture

### Core Components

- **Common Utilities** (`src/common/`): Shared blockchain configurations and utilities
- **Examples** (`src/examples/`): Various agent implementations and patterns
- **Documentation** (`docs/`): Detailed guides and prompts for specific operations

### Example Categories

#### Standalone Agents

- **Vercel AI SDK**: Direct AI integration examples
- **LangChain**: Structured chat agents with tool integration

#### Communication Platforms

- **Telegram**: Interactive Telegram bots with Claude AI
- **Email**: Email-based agent interactions
- **XMTP**: Decentralized messaging integration

## Quick Start

### Prerequisites

- Node.js 23.11.1+ (managed via Volta)
- npm 11.5.2+
- API keys for your chosen AI provider
- Access to Boson Protocol MCP server

### Installation

```bash
# Clone the repository
git clone https://github.com/bosonprotocol/agent-builder.git
cd agent-builder

# Install all dependencies
npm install
```

### Available Examples

#### Start a Telegram Bot

```bash
npm run start:telegram-bot-vercel
```

#### Run Standalone Vercel Agent

```bash
npm run start:standalone-vercel
```

#### Start LangChain Agent

```bash
npm run start:standalone-langchain
```

#### Launch Email Agent

```bash
npm run start:email
```

#### Start XMTP Agent

```bash
npm run start:xmtp
```

## Examples

### Telegram Bot (`src/examples/telegram/`)

Interactive Telegram bot powered by Claude AI with full Boson Protocol integration. Features secure wallet management, multi-chain support, and conversational AI capabilities.

**Key Features:**

- Claude AI integration for natural conversations
- Secure in-memory private key storage
- Multi-chain blockchain operations
- Dynamic tool loading per network
- User context management

### Standalone Agents (`src/examples/standalone/`)

#### Vercel AI SDK

Direct integration examples using Vercel's AI SDK, demonstrating how to build command-line agents with Boson Protocol tools.

#### LangChain Integration

Structured chat agents using LangChain framework with GOAT SDK adapter, providing a clean pattern for tool-based AI interactions.

### Communication Integrations

#### Email Agent (`src/examples/email/`)

Email-based agent that can process commerce operations through email interactions, perfect for asynchronous workflows.

#### XMTP Integration (`src/examples/xmtp/`)

Decentralized messaging integration using XMTP protocol, enabling Web3-native communication channels.

## Configuration

Each example includes its own environment configuration. Common environment variables include:

```env
# AI Provider Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Boson Protocol
BOSON_MCP_URL=https://boson-mcp-server-staging-170470978472.europe-west2.run.app/mcp

# Platform-specific
TG_BOT_TOKEN=your_telegram_bot_token           # For Telegram examples
XMTP_BOSON_MCP_URL=your_xmtp_mcp_server_url   # For XMTP examples - MCP server URL for XMTP interactions
```

## Documentation

### Operation Guides (`docs/prompts/`)

- **create-offer.md**: Guide for creating offers on Boson Protocol
- **commit-offer.md**: Instructions for committing to offers
- **redeem-exchange.md**: Exchange redemption process
- **create-seller-if-needed.md**: Seller entity creation workflow

### Common Utilities (`src/common/`)

- **chains.ts**: Blockchain network configurations
- **README.md**: Shared utilities documentation

## Development

### Workspace Structure

This project uses npm workspaces for managing multiple packages:

```
src/examples/
├── standalone/vercel/     # Vercel AI SDK examples
├── standalone/langchain/  # LangChain integration
├── telegram/vercel/       # Telegram bot implementation
├── email/                 # Email agent
└── xmtp/                  # XMTP messaging
```

### Development Commands

```bash
# Watch mode for development
npm run watch

# Linting
npm run lint
npm run lint:fix

# Start specific examples
npm run start:telegram-bot-vercel
npm run start:standalone-vercel
npm run start:standalone-langchain
npm run start:email
npm run start:xmtp
```

### Adding New Examples

1. Create a new directory under `src/examples/`
2. Add workspace configuration to root `package.json`
3. Create example-specific `package.json` with dependencies
4. Implement your agent following existing patterns
5. Add startup script to root package.json

## Boson Protocol Integration

All examples integrate with Boson Protocol's decentralized commerce infrastructure through the MCP (Model Context Protocol) server. This enables agents to:

- Create and manage seller/buyer entities
- Create and list offers
- Handle commitments and exchanges
- Process redemptions and disputes
- Manage multi-chain operations

### Transaction Flow

1. Agent receives user request
2. Calls appropriate Boson Protocol MCP tool
3. Receives transaction data (to, data fields)
4. Signs transaction with user's wallet
5. Broadcasts transaction to blockchain
6. Monitors transaction confirmation

## Security Considerations

- **Private Key Management**: All examples implement secure, memory-only private key storage
- **Environment Variables**: Sensitive data managed through environment configuration
- **Transaction Validation**: All blockchain operations include proper validation
- **Error Handling**: Comprehensive error handling with secure logging

## Dependencies

### Core Dependencies

- `@bosonprotocol/agentic-commerce`: Boson Protocol MCP integration
- `@bosonprotocol/chat-sdk`: Communication utilities
- `@bosonprotocol/common`: Shared protocol utilities
- `grammy`: Telegram Bot API framework

### Development Tools

- TypeScript with strict configuration
- ESLint with comprehensive rule set
- Prettier for code formatting
- Turbo for build optimization

## Version Management

This project uses Volta for Node.js version management:

- Node.js: 23.11.1
- npm: 11.5.2

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow existing code patterns and conventions
4. Add tests for new functionality
5. Ensure all linting passes
6. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/bosonprotocol/agent-builder/issues)
- **Documentation**: Check individual example READMEs
- **Boson Protocol**: [Protocol Documentation](https://docs.bosonprotocol.io/)
