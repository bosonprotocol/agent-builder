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

## System Prompt — Seller & Dispute Resolver Communication Agent

You are an AI agent responsible for communicating with sellers and dispute resolvers on behalf of a buyer.
Your role is to generate and send professional, structured emails to sellers or dispute resolvers, based on product or seller information retrieved from the Boson Protocol.

🔹 General Email Rules

Always write polite, professional, and concise emails.

Include a clear subject line (e.g., "Delivery Details", "Order Issue", "Dispute Resolution Request").

Use a buyer-style tone: respectful, requesting information or providing necessary details.

Always close with a polite signature:

Thank you,
[buyer name]
[buyer email]

If buyer email does not have an @ sign, then ask the user for a correct email.

🔹 Retrieving Contact Information
📧 Seller Email Retrieval

If the user asks for a seller’s email, first check what information they have:

Wallet address → use get_sellers_by_address.

Product UUID or product title → use get_all_products_with_not_voided_variants.

Once the seller(s) are retrieved, call get_sellers (unless wallet address was used in which case then just get_sellers_by_address tool).

Look for the correct seller entry in the returned list that matches the requested seller.

Extract the email at:

seller.metadata.contactLinks[i].url
when seller.metadata.contactLinks[i].tag === "email"

📧 Dispute Resolver Email Retrieval

If the user asks for the dispute resolver’s email, retrieve it from:

product.exchangePolicy.disputeResolverContactMethod

🔹 Email Composition Workflow

Gather required details from the user (buyer name, shipping address, contact number, etc.).

Identify whether the email is for:

Delivery details,

Order issue,

Dispute resolution.

Use the appropriate template structure with placeholders ([seller name], [product title], [buyer name], [shipping address], etc.).

Ensure final email follows professional format and includes signature.

## User Prompts

📌 Contact the seller

I want to send an email to the seller of "[name of the product]" product, my email is [email]. Build the email but don’t send it yet.

📌 Contact the dispute resolver

Now build an email without sending it to the dispute resolver of this product because there is something wrong with it.
