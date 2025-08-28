# 📧 Email + Boson MCP Integration

This project demonstrates how to interact with the **Boson MCP Server plugin** and send emails through the **Gmail AutoAuth MCP server**.  
It combines blockchain wallet operations with AI-driven tooling, allowing supported AI models to call tools for on-chain actions and email sending.

---

## Configure Environment Variables

Copy the example environment file and fill in your secrets:

You’ll need to set:

- `PRIVATE_KEY` → Your blockchain wallet private key (for Boson MCP tools).
- `ANTHROPIC_API_KEY` → API key from [Anthropic Console](https://console.anthropic.com/).
- `BOSON_MCP_URL` → MCP server endpoint (staging or production).
- `SMITHERY_GMAIL_KEY` → Generated key for Gmail MCP server.

👉 **Google Cloud Setup for Email MCP**:  
The Gmail MCP server requires a Google Cloud setup. Follow the instructions in the repo:  
🔗 [Gmail-MCP-Server](https://github.com/GongRzhe/Gmail-MCP-Server/tree/main)

Generate your email MCP key here:  
🔗 [Smithery Gmail AutoAuth MCP](https://smithery.ai/server/@gongrzhe/server-gmail-autoauth-mcp)

---

## ▶️ Running the Project

Start the interactive MCP client:

This will:

1. Connect to the **Boson MCP server** with your wallet.
2. Load the **sendEmailTool** from the Gmail MCP server.
3. Allow you to enter prompts and watch the tools being called automatically.

## 🛠 Available Tools

- **Boson MCP Tools** → On-chain commerce operations.
- **sendEmailTool** → Send emails via Gmail MCP (configured with your Smithery key).

---
