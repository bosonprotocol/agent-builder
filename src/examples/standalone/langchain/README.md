# Boson Protocol LangChain Agent

A clean, simple LangChain agent that integrates with the Boson Protocol MCP server using the GOAT SDK LangChain adapter.

## Overview

This agent demonstrates how to use LangChain's structured chat agent with Boson Protocol's MCP tools, providing access to decentralized commerce tools through a simple command-line chat interface.

## Features

- **LangChain Integration**: Uses LangChain's structured chat agent with GOAT SDK adapter
- **Direct Tool Usage**: No complex tool mapping - tools work directly with LangChain
- **Commerce Tools**: Full access to Boson Protocol's commerce functionality
- **Interactive CLI**: Simple command-line interface for testing
- **Minimal Codebase**: Single-file implementation for easy understanding (~150 lines)

## Setup

### Prerequisites

1. Node.js 23.11.1+
2. Access to Boson Protocol MCP server
3. Anthropic API key

### Installation

From the root directory:

```bash
# Install dependencies
npm install
```

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in the `.env` file:
   ```env
   # Required
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   CHAIN_ID = chain_id_matching_chainId_from_config
   
   # Optional - defaults to staging if not provided
   BOSON_MCP_URL=https://boson-mcp-server-staging-170470978472.europe-west2.run.app/mcp
   
   # Optional - for debugging and tracing
   LANGSMITH_API_KEY=your_langsmith_key_here
   LANGCHAIN_PROJECT=boson-langgraph-agent
   ```

## Usage

### Start the Agent

From this directory (`src/examples/standalone/langchain`):

```bash
# After setting up .env file
npm run start
```

Or using the root workspace command:
```bash
# From root directory
npm run start:standalone-langchain
```

Or with environment variables inline:
```bash
ANTHROPIC_API_KEY=your_key_here npm run start
```

## Configuration

The agent uses a structured chat prompt from LangChain Hub ([hwchase17/structured-chat-agent](https://smith.langchain.com/hub/hwchase17?organizationId=6e7cb68e-d5eb-56c1-8a8a-5a32467e2996)) which provides the framework for tool usage and structured responses.

### MCP Server

The agent connects to Boson Protocol's MCP server which provides all the commerce tools. The staging server is used by default for testing.
You can run your own local enrionment from [agentic-commerce](https://github.com/bosonprotocol/agentic-commerce)  repository.

## Architecture

### Project Structure

```
src/examples/standalone/langchain/
├── index.ts         # Single-file LangChain agent implementation
├── package.json     # Dependencies and scripts
├── .env.example     # Environment configuration (shared from parent)
└── README.md        # This documentation
```

### Key Components

- **`main`**: Main function implementing LangChain agent
- **`createStructuredChatAgent`**: LangChain's structured chat agent
- **`AgentExecutor`**: Executes agent with tool access
- **`getOnChainTools`**: GOAT SDK adapter for LangChain tools

### Dependencies

- `@goat-sdk/adapter-langchain` - GOAT SDK LangChain adapter
- `@langchain/anthropic` - Anthropic Claude integration  
- `langchain` - Core LangChain framework
- `@langchain/core` - Core LangChain components

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**
   - Check that BOSON_MCP_URL is correct
   - Verify network connectivity
   - Try with staging URL first

2. **No Tools Available**
   - Ensure MCP server is responding
   - Check server logs for errors
   - Verify MCP server configuration

3. **Anthropic API Errors**
   - Verify ANTHROPIC_API_KEY is correct
   - Check API quota and billing
   - Ensure model access permissions