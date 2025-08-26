import { Bot } from "grammy";
import { createAnthropic } from "@ai-sdk/anthropic";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";
import { generateText } from "ai";
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";
import { bosonProtocolPlugin } from "@bosonprotocol/agentic-commerce";

// Environment variables validation
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BOSON_MCP_URL = process.env.BOSON_MCP_URL;
const RPC_URL = process.env.RPC_URL || "https://rpc-amoy.polygon.technology";

if (!TG_BOT_TOKEN) {
  throw new Error("TG_BOT_TOKEN environment variable is required");
}

if (!BOSON_MCP_URL) {
  throw new Error("BOSON_MCP_URL environment variable is required");
}

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is required");
}
const chain = polygonAmoy; // TODO: should match CONFIG_IDS of MCP server
// Create Anthropic client
const anthropic = createAnthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Create Telegram bot
const bot = new Bot(TG_BOT_TOKEN);

// Store conversation contexts and user wallets per user
const userContexts = new Map<
  number,
  Array<{ role: "user" | "assistant"; content: string }>
>();
const userWallets = new Map<
  number,
  { privateKey: string; address: string; tools: any }
>();

// Initialize wallet and get on-chain tools for a specific user
async function initializeUserWallet(privateKey: string) {
  try {
    // Ensure private key has 0x prefix and is the correct length
    const formattedPrivateKey = privateKey.startsWith("0x")
      ? privateKey
      : `0x${privateKey}`;

    // Validate private key format
    if (
      formattedPrivateKey.length !== 66 ||
      !/^0x[0-9a-fA-F]{64}$/.test(formattedPrivateKey)
    ) {
      throw new Error(
        "Invalid private key format. Must be 64 hex characters (with or without 0x prefix)"
      );
    }

    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(RPC_URL),
    });

    // Check balance
    const publicClient = createPublicClient({
      chain,
      transport: http(RPC_URL),
    });

    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`💰 User wallet initialized: ${account.address}`);
    console.log(`💰 Balance: ${balance} MATIC on ${chain.name}`);

    // Get on-chain tools with Boson Protocol plugin
    const tools = await getOnChainTools({
      wallet: viem(walletClient),
      plugins: [bosonProtocolPlugin({ url: BOSON_MCP_URL })],
    });

    return {
      privateKey: formattedPrivateKey,
      address: account.address,
      tools,
      balance: balance.toString(),
    };
  } catch (error) {
    throw new Error(`Failed to initialize wallet: ${error}`);
  }
}

// Get default tools without wallet
async function getDefaultTools() {
  try {
    // Initialize without wallet - some tools may still work
    console.log("⚠️  Initializing tools without wallet support");
    const walletClient = createWalletClient({
      // TODO: not sure if this is ok or walletClient should be undefined
      account: undefined as any,
      chain,
      transport: http(RPC_URL),
    });
    const tools = await getOnChainTools({
      wallet: viem(walletClient),
      plugins: [bosonProtocolPlugin({ url: BOSON_MCP_URL })],
    });

    console.log("🔧 Available default MCP tools:", Object.keys(tools));
    return tools;
  } catch (error) {
    console.warn(
      "⚠️ Failed to initialize default tools, falling back to empty tools (this error is expected):",
      error
    );
    return {};
  }
}

// Initialize tools on startup
let mcpTools: any = {};

// Handle /start command
bot.command("start", async (ctx) => {
  const welcomeMessage = `🤖 Welcome to your Claude AI Telegram Bot with Boson Protocol MCP integration!

🔧 Available commands:
• Just send me any message and I'll respond using Claude AI
• /wallet - Set up your wallet for blockchain operations
• /wallet_status - Check your wallet status
• /remove_wallet - Remove your wallet (for security)
• /clear - Clear conversation history
• /help - Show this message again

💡 Examples of what you can ask:
• "What's the latest in blockchain?"
• "Help me create a smart contract"
• "Explain how Boson Protocol works"

🔒 **Security Note**: Your private key is stored securely in memory only and never logged or saved to disk.`;

  await ctx.reply(welcomeMessage);
});

// Handle /help command
bot.command("help", async (ctx) => {
  await ctx.reply(`🆘 Help - Claude AI Bot with MCP Integration

This bot uses Claude AI and can interact with the Boson Protocol MCP server for blockchain operations.

📝 Commands:
• /start - Welcome message
• /wallet - Set up your private key for blockchain operations
• /wallet_status - Check your wallet status and balance
• /remove_wallet - Remove your wallet for security
• /clear - Clear conversation history
• /help - Show this help

💬 Just send any message and I'll respond using Claude AI with access to blockchain tools!

🔒 **Security**: Private keys are stored in memory only, never saved to disk.`);
});

// Handle /wallet command
bot.command("wallet", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (userWallets.has(userId)) {
    const wallet = userWallets.get(userId)!;
    await ctx.reply(
      `🔒 You already have a wallet configured!\n\n💰 Address: ${wallet.address} \n\nUse /remove_wallet to remove it first if you want to change it.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Add user to waiting list for private key input
  waitingForPrivateKey.add(userId);

  await ctx.reply(
    `🔑 *Set up your wallet for blockchain operations*

Please send me your private key in the next message. 

🔒 *Security Notes*:
• Your private key is stored in memory only, never saved to disk
• Messages are automatically deleted for security
• Use /remove_wallet to remove your key when done
• Only use test wallets/keys, never your main wallet

📝 *Format*: Send just the private key (with or without 0x prefix)
🚰 *Get test MATIC*: https://faucet.polygon.technology/

Send your private key now:`,
    { parse_mode: "HTML" }
  );
});

// Handle /wallet_status command
bot.command("wallet_status", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const wallet = userWallets.get(userId);
  if (!wallet) {
    await ctx.reply(
      "❌ No wallet configured. Use /wallet to set up your private key."
    );
    return;
  }

  try {
    // Get fresh balance
    const publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(RPC_URL),
    });

    const balance = await publicClient.getBalance({
      address: wallet.address as `0x${string}`,
    });
    const balanceInMatic = (Number(balance) / 1e18).toFixed(4);

    await ctx.reply(
      `✅ *Wallet Status*

💰 *Address*: ${wallet.address}
💎 *Balance*: ${balanceInMatic} MATIC
🔗 *Network*: Polygon Amoy (Testnet)
🛠️ *MCP Tools*: ${Object.keys(wallet.tools).length} available

🔒 *Security*: Private key stored in memory only`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    await ctx.reply(`❌ Error checking wallet status: ${error}`);
  }
});

// Handle /remove_wallet command
bot.command("remove_wallet", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (!userWallets.has(userId)) {
    await ctx.reply("❌ No wallet configured to remove.");
    return;
  }

  userWallets.delete(userId);
  await ctx.reply(
    "🗑️ *Wallet removed successfully!*\n\nYour private key has been cleared from memory for security."
  );
});

// Handle /clear command
bot.command("clear", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    userContexts.delete(userId);
    await ctx.reply("🧹 Conversation history cleared!");
  }
});

// Store users waiting for private key input
const waitingForPrivateKey = new Set<number>();

// Handle private key input
async function handlePrivateKeyInput(
  ctx: any,
  userId: number,
  privateKey: string
) {
  // Remove user from waiting list
  waitingForPrivateKey.delete(userId);

  // Delete the message containing the private key for security
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.warn("Could not delete private key message:", error);
  }

  try {
    await ctx.replyWithChatAction("typing");

    // Initialize wallet with the provided private key
    const walletData = await initializeUserWallet(privateKey);

    // Store wallet data for the user
    userWallets.set(userId, walletData);

    const balanceInMatic = (Number(walletData.balance) / 1e18).toFixed(4);

    await ctx.reply(
      `✅ *Wallet configured successfully!*\n\n💰 *Address*: ${
        walletData.address
      }
💎 *Balance*: ${balanceInMatic} MATIC
🔗 *Network*: Polygon Amoy (Testnet)
🛠️ *MCP Tools*: ${
        Object.keys(walletData.tools).length
      } blockchain tools available

🔒 Your private key is stored securely in memory only.
🗑️ Use /remove_wallet to clear it when done.

You can now use blockchain features! Try asking me about Boson Protocol or blockchain operations.`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    await ctx.reply(`❌ *Failed to set up wallet*

Error: ${error}

Please try again with a valid private key. Make sure it's a 64-character hex string (with or without 0x prefix).`);
  }
}

// Handle all text messages
bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  const userMessage = ctx.message.text;

  if (!userId || !userMessage) {
    return;
  }

  // Check if user is setting up a wallet
  if (waitingForPrivateKey.has(userId)) {
    await handlePrivateKeyInput(ctx, userId, userMessage);
    return;
  }

  // Show typing indicator
  await ctx.replyWithChatAction("typing");

  try {
    // Get user's tools (either their wallet tools or default tools)
    const userWallet = userWallets.get(userId);
    const toolsToUse = userWallet ? userWallet.tools : mcpTools;

    // Get or initialize user context
    let context = userContexts.get(userId) || [];

    // Add user message to context
    context.push({ role: "user", content: userMessage });

    // Keep context manageable (last 10 messages)
    if (context.length > 10) {
      context = context.slice(-10);
    }

    // Create system message with MCP capabilities
    let systemMessage = `You are Claude, an AI assistant integrated with a Telegram bot. You have access to the Boson Protocol MCP server for blockchain and e-commerce operations.`;

    if (userWallet) {
      systemMessage += `\n\nThe user has a wallet configured:
- Address: ${userWallet.address}
- You have access to blockchain tools for this wallet

You can perform blockchain operations, smart contract interactions, and e-commerce functionality using the MCP tools.`;
    } else {
      systemMessage += `\n\nThe user has not configured a wallet yet. You can still provide general information, but for blockchain operations, suggest they use /wallet to set up their private key.`;
    }

    systemMessage += `\n\nBe helpful, conversational, and use the MCP tools when relevant. Always provide clear and concise responses suitable for a chat interface.`;

    // Prepare messages for Claude
    const messages = [
      { role: "system" as const, content: systemMessage },
      ...context.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    let result;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        result = await generateText({
          model: anthropic("claude-3-5-sonnet-20241022"),
          messages,
          tools: toolsToUse,
          maxSteps: 10,
        });
        break; // Success, exit loop
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        if (attempts >= maxAttempts) {
          throw error; // Rethrow error after max attempts
        }
        // Add error to messages for the next attempt
        messages.push({
          role: "assistant",
          content: `Tool call failed with error: ${error}. I will try again.`,
        });
      }
    }

    const responseText =
      result.text || "Sorry, I couldn't generate a response.";

    // Add assistant response to context
    context.push({ role: "assistant", content: responseText });
    userContexts.set(userId, context);

    // Split long messages to respect Telegram's limits
    const maxMessageLength = 4096;
    if (responseText.length <= maxMessageLength) {
      await ctx.reply(responseText);
    } else {
      // Split message into chunks
      const chunks = [];
      for (let i = 0; i < responseText.length; i += maxMessageLength) {
        chunks.push(responseText.slice(i, i + maxMessageLength));
      }

      for (const chunk of chunks) {
        await ctx.reply(chunk);
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
    await ctx.reply(
      "❌ Sorry, I encountered an error while processing your message. Please try again."
    );
  }
});

// Handle other message types
bot.on("message", async (ctx) => {
  if (!ctx.message.text) {
    await ctx.reply(
      "📝 I can only process text messages right now. Please send me a text message!"
    );
  }
});

// Error handling
bot.catch((err) => {
  console.error("Bot error:", err);
});

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("Received SIGINT. Gracefully shutting down...");
  bot.stop();
  process.exit(0);
});

process.once("SIGTERM", () => {
  console.log("Received SIGTERM. Gracefully shutting down...");
  bot.stop();
  process.exit(0);
});

// Start the bot
async function startBot() {
  console.log("🚀 Starting Telegram bot with Claude AI and MCP integration...");
  console.log(`📡 MCP Server URL: ${BOSON_MCP_URL}`);

  // Initialize default MCP tools (without wallet)
  try {
    mcpTools = await getDefaultTools();
    console.log("✅ Default MCP tools initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize default MCP tools:", error);
    console.log("🔄 Bot will start without MCP tools");
    mcpTools = {};
  }

  // Start the bot
  bot.start();
  console.log("✅ Bot started successfully");
}

startBot().catch(console.error);
