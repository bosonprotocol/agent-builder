import { createAnthropic } from "@ai-sdk/anthropic";
import { bosonProtocolPlugin } from "@bosonprotocol/agentic-commerce";
import { type ConfigId, getChainIdFromConfigId } from "@bosonprotocol/common";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";
import { type CoreTool, generateText } from "ai";
import { Bot, Context, Filter } from "grammy";
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";
import zod from "zod";

import { BOSON_MCP_URL, CHAIN_MAP, isStaging } from "#common/chains.js";

// Environment variables validation
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!TG_BOT_TOKEN) {
  throw new Error("TG_BOT_TOKEN environment variable is required");
}

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is required");
}

// Create Anthropic client
const anthropic = createAnthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Create Telegram bot
const bot = new Bot(TG_BOT_TOKEN);
type MessageContext = Filter<Context, "message">;

// Store conversation contexts and user wallets per user
const userContexts = new Map<
  number,
  Array<{ role: "user" | "assistant"; content: string }>
>();

interface WalletData {
  privateKey: string;
  address: string;
  // Store tools per chain/config
  chainTools: Map<
    number,
    {
      [key: string]: CoreTool;
    }
  >; // chainId -> tools
  availableConfigs: ConfigData[]; // Available MCP configurations
}

interface ConfigData {
  id: string;
  chainId: number;
  name: string;
}

const userWallets = new Map<number, WalletData>();

// Get available config IDs from MCP server
async function getAvailableConfigs(): Promise<ConfigData[]> {
  try {
    console.log("🔍 Fetching available MCP configurations...");

    // Initialize tools without wallet to get read-only access
    const tools = await getOnChainTools({
      wallet: viem(
        createWalletClient({
          // No wallet needed for read-only
          chain: polygonAmoy, // it doesn't matter which chain here, get_config_ids tool doesnt need any wallet
          transport: http("https://rpc-amoy.polygon.technology"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
      plugins: [bosonProtocolPlugin({ url: BOSON_MCP_URL })],
    });
    // Call get_config_ids tool if available
    if (
      tools.get_config_ids &&
      typeof tools.get_config_ids === "object" &&
      "execute" in tools.get_config_ids &&
      typeof tools.get_config_ids.execute === "function"
    ) {
      const configResult = await tools.get_config_ids.execute(null, null);
      console.log("✅ Available MCP configurations:", configResult);
      return (
        (JSON.parse(configResult.message[0].text).configIds.map(
          (configId: string) =>
            ({
              chainId: getChainIdFromConfigId(
                isStaging ? "staging" : "production",
                configId as ConfigId,
              ),
              id: configId,
              name: configId,
            }) satisfies ConfigData,
        ) as ConfigData[]) || []
      );
    } else {
      console.warn("⚠️ get_config_ids tool not available");
      return []; // fallback
    }
  } catch (error) {
    console.error("❌ Failed to get MCP configurations:", error);
    return []; // fallback
  }
}

// Initialize wallet tools for a specific chain
async function initializeWalletForChain(privateKey: string, chainId: number) {
  try {
    const chainConfig = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const formattedPrivateKey = privateKey.startsWith("0x")
      ? privateKey
      : `0x${privateKey}`;

    if (
      formattedPrivateKey.length !== 66 ||
      !/^0x[0-9a-fA-F]{64}$/.test(formattedPrivateKey)
    ) {
      throw new Error(
        "Invalid private key format. Must be 64 hex characters (with or without 0x prefix)",
      );
    }

    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain: chainConfig.chain,
      transport: http(chainConfig.rpc),
    });

    // Get tools for this specific chain
    const tools = await getOnChainTools({
      wallet: viem(walletClient),
      plugins: [bosonProtocolPlugin({ url: BOSON_MCP_URL })],
    });

    console.log(
      `✅ Wallet tools initialized for chain ${chainId} (${chainConfig.chain.name})`,
    );
    return tools;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to initialize wallet for chain ${chainId}: ${error.message}`,
      );
    }
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      `Failed to initialize wallet for chain ${chainId}: ${String(error)}`,
    );
  }
}

// Get or create wallet tools for a specific config
async function getWalletToolsForConfig(userId: number, configId: string) {
  const walletData = userWallets.get(userId);
  if (!walletData) {
    throw new Error(
      "No wallet configured. Use /wallet to set up your private key.",
    );
  }

  // Find the config to get chain ID
  const config = walletData.availableConfigs.find(
    (c) => c.id === configId || c.chainId.toString() === configId,
  );
  if (!config) {
    throw new Error(`Configuration ${configId} not found in available configs`);
  }

  const chainId = config.chainId;

  // Check if we already have tools for this chain
  if (walletData.chainTools.has(chainId)) {
    return walletData.chainTools.get(chainId);
  }

  // Initialize tools for this chain
  console.log(`🔧 Initializing wallet tools for chain ${chainId}...`);
  const tools = await initializeWalletForChain(walletData.privateKey, chainId);

  // Cache the tools
  walletData.chainTools.set(chainId, tools);

  return tools;
}

// Initialize user wallet with all available configurations
async function initializeUserWallet(privateKey: string) {
  try {
    const formattedPrivateKey = privateKey.startsWith("0x")
      ? privateKey
      : `0x${privateKey}`;

    if (
      formattedPrivateKey.length !== 66 ||
      !/^0x[0-9a-fA-F]{64}$/.test(formattedPrivateKey)
    ) {
      throw new Error(
        "Invalid private key format. Must be 64 hex characters (with or without 0x prefix)",
      );
    }

    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    // Get available configurations from MCP
    const availableConfigs = await getAvailableConfigs();

    console.log(`💰 User wallet initialized: ${account.address}`);
    console.log(
      `🔧 Available configurations: ${JSON.stringify(availableConfigs, null, 2)}`,
    );

    return {
      privateKey: formattedPrivateKey,
      address: account.address,
      chainTools: new Map<
        number,
        {
          [key: string]: CoreTool;
        }
      >(),
      availableConfigs,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to initialize wallet: ${error.message}`);
    }

    // Handle non-Error cases (string, number, object, etc.)
    throw new Error(`Failed to initialize wallet: ${JSON.stringify(error)}`);
  }
}

// Get default tools without wallet
async function getDefaultTools() {
  try {
    console.log("⚠️ Initializing tools without wallet support");
    const tools = await getOnChainTools({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wallet: undefined as any,
      plugins: [bosonProtocolPlugin({ url: BOSON_MCP_URL })],
    });

    console.log("🔧 Available default MCP tools:", Object.keys(tools));
    return tools;
  } catch (error) {
    console.warn("⚠️ Failed to initialize default tools:", error);
    return {};
  }
}

// Initialize tools on startup
let mcpTools: Record<string, CoreTool> = {};

const welcomeMessage = `🤖 Welcome to your Claude AI Telegram Bot with Boson Protocol MCP integration!

🔧 Available commands:
• Just send me any message and I'll respond using Claude AI
• /wallet - Set up your wallet for blockchain operations
• /wallet_status - Check your wallet status
• /chains - View supported chains and configurations
• /remove_wallet - Remove your wallet (for security)
• /clear - Clear user data
• /help - Show this message again

💡 Examples of what you can ask:
• "What's the latest in blockchain?"
• "Help me create a smart contract"
• "Explain how Boson Protocol works"

🔒 **Security Note**: Your private key is stored securely in memory only and never logged or saved to disk.`;

// Handle /start command
bot.command("start", async (ctx) => {
  await ctx.reply(welcomeMessage);
});

// Handle /help command
bot.command("help", async (ctx) => {
  await ctx.reply(welcomeMessage);
});

// Handle /chains command
bot.command("chains", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const configs = await getAvailableConfigs();

    let message = "🔗 **Available Blockchain Configurations:**\n\n";

    configs.forEach((config: ConfigData) => {
      const chainInfo = CHAIN_MAP[config.chainId as keyof typeof CHAIN_MAP];

      message += `📍 **${config.id}**\n`;
      message += `   • Network: ${chainInfo.chain.name}\n`;
      message += `   • Chain ID: ${config.chainId}\n`;
      message += "\n";
    });

    const walletData = userWallets.get(userId);
    if (walletData) {
      message += `\n🔧 Your wallet is configured and can operate on all these chains.\n`;
      message += `💡 Tools will be initialized automatically when needed for each chain.`;
    } else {
      message += `\n⚠️ Use /wallet to set up your private key for blockchain operations.`;
    }

    await ctx.reply(message, { parse_mode: "HTML" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);

    await ctx.reply(`❌ Error fetching chain information: ${message}`);
  }
});

// Handle /wallet command
bot.command("wallet", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (userWallets.has(userId)) {
    const wallet = userWallets.get(userId);
    await ctx.reply(
      `🔒 You already have a wallet configured!\n\n💰 Address: ${wallet.address}\n🔧 Configurations: ${wallet.availableConfigs.length} available\n\nUse /remove_wallet to remove it first if you want to change it.`,
      { parse_mode: "HTML" },
    );
    return;
  }

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
🚰 *Get test tokens*: Use faucets for the chains you want to use

Send your private key now:`,
    { parse_mode: "HTML" },
  );
});

// Handle /wallet_status command
bot.command("wallet_status", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const wallet = userWallets.get(userId);
  if (!wallet) {
    await ctx.reply(
      "❌ No wallet configured. Use /wallet to set up your private key.",
    );
    return;
  }

  try {
    let statusMessage = `✅ **Wallet Status**\n\n💰 **Address**: ${wallet.address}\n🔧 **Available Configurations**: ${wallet.availableConfigs.length}\n\n`;

    // Show status for each available chain
    for (const config of wallet.availableConfigs) {
      const chainInfo = CHAIN_MAP[config.chainId as keyof typeof CHAIN_MAP];
      if (chainInfo) {
        statusMessage += `📍 **${config.name || `Chain ${config.chainId}`}**\n`;

        try {
          const publicClient = createPublicClient({
            chain: chainInfo.chain,
            transport: http(chainInfo.rpc),
          });

          const balance = await publicClient.getBalance({
            address: wallet.address as `0x${string}`,
          });
          const balanceFormatted = formatUnits(
            balance,
            chainInfo.chain.nativeCurrency.decimals,
          );
          statusMessage += `   • Balance: ${balanceFormatted} ${chainInfo.chain.nativeCurrency?.symbol || "ETH"}\n`;
        } catch {
          statusMessage += `   • Balance: Error fetching\n`;
        }

        const hasTools = wallet.chainTools.has(config.chainId);
        statusMessage += `   • Tools: ${hasTools ? "Initialized" : "Will initialize when needed"}\n\n`;
      }
    }

    statusMessage += `🔒 **Security**: Private key stored in memory only`;

    await ctx.reply(statusMessage, { parse_mode: "HTML" });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const message = error instanceof Error ? error.message : String(error);

    await ctx.reply(`❌ Error checking wallet status: ${message}`);
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
    "🗑️ *Wallet removed successfully!*\n\nYour private key and all chain tools have been cleared from memory for security.",
    { parse_mode: "HTML" },
  );
});

// Handle /clear command
bot.command("clear", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    userContexts.delete(userId);
    await ctx.reply("🧹 User data has been cleared!");
  }
});

// Store users waiting for private key input
const waitingForPrivateKey = new Set<number>();

// Handle private key input
async function handlePrivateKeyInput(
  ctx: MessageContext,
  userId: number,
  privateKey: string,
) {
  waitingForPrivateKey.delete(userId);

  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.warn("Could not delete private key message:", error);
  }

  try {
    await ctx.replyWithChatAction("typing");

    const walletData = await initializeUserWallet(privateKey);
    userWallets.set(userId, walletData);

    await ctx.reply(
      `✅ *Wallet configured successfully!*\n\n💰 **Address**: ${walletData.address}
🔧 **Configurations**: ${walletData.availableConfigs.length} blockchain configurations available
🛠️ **Tools**: Will be initialized automatically for each chain when needed

🔒 Your private key is stored securely in memory only.
🗑️ Use /remove_wallet to clear it when done.
📍 Use /chains to see all supported networks.

You can now use blockchain features across multiple chains! Try asking me about Boson Protocol or blockchain operations.`,
      { parse_mode: "HTML" },
    );
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const message = error instanceof Error ? error.message : String(error);

    await ctx.reply(
      `❌ *Failed to set up wallet*\n\nError: ${message}\n\nPlease try again with a valid private key.`,
    );
  }
}

// Enhanced message handling with dynamic tool initialization
bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  const userMessage = ctx.message.text;

  if (!userId || !userMessage) {
    return;
  }

  if (waitingForPrivateKey.has(userId)) {
    await handlePrivateKeyInput(ctx, userId, userMessage);
    return;
  }

  await ctx.replyWithChatAction("typing");

  try {
    const userWallet = userWallets.get(userId);
    let context = userContexts.get(userId) || [];
    context.push({ role: "user", content: userMessage });

    if (context.length > 10) {
      // remove "if", if you need the model to keep a longer conversation in memory
      context = context.slice(-10);
    }

    let systemMessage = `You are Claude, an AI assistant integrated with a Telegram bot. You have access to the Boson Protocol MCP server for blockchain and e-commerce operations.`;

    if (userWallet) {
      systemMessage += `\n\nThe user has a wallet configured:
- Address: ${userWallet.address}
- Available configurations: ${userWallet.availableConfigs.map((c) => `${c.name || "Chain " + c.chainId} (${c.chainId})`).join(", ")}

When you need to use blockchain tools for a specific operation, the system will automatically initialize the appropriate chain tools based on the config_id parameter. You can reference any of the available chain configurations.`;
    } else {
      systemMessage += `\n\nThe user has not configured a wallet yet. You can still provide general information, but for blockchain operations, suggest they use /wallet to set up their private key.`;
    }

    systemMessage += `\n\nBe helpful, conversational, and use the MCP tools when relevant. Always provide clear and concise responses suitable for a chat interface.`;

    const messages = [
      { role: "system" as const, content: systemMessage },
      ...context.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];
    const supportedConfigIds = userWallet?.availableConfigs.map(
      (config) => config.id,
    );
    const resolveToolForConfig: CoreTool = {
      type: "function",
      parameters: zod.object({
        configId: zod.string().refine(
          (value) => supportedConfigIds?.includes(value as ConfigId),
          (value) => ({
            message: `Invalid config ID: ${value}. Supported config IDs: ${supportedConfigIds?.join(", ")}`,
          }),
        ),
      }),
      execute: async ({ configId }: { configId: string }) => {
        return await getWalletToolsForConfig(userId, configId);
      },
    };
    // Create a dynamic tool resolver that initializes tools as needed
    const toolResolver = userWallet
      ? {
          ...mcpTools,
          // Add a wrapper that can dynamically initialize chain-specific tools
          resolveToolForConfig,
        }
      : mcpTools;

    const result = await generateText({
      model: anthropic("claude-sonnet-4-6"), // change model as needed
      messages,
      tools: toolResolver,
      maxSteps: 10,
    });

    const responseText =
      result.text || "Sorry, I couldn't generate a response.";
    context.push({ role: "assistant", content: responseText });
    userContexts.set(userId, context);

    // Split long messages
    const maxMessageLength = 4096; // TODO: maybe this should be increased
    if (responseText.length <= maxMessageLength) {
      await ctx.reply(responseText);
    } else {
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
      "❌ Sorry, I encountered an error while processing your message. Please try again.",
    );
  }
});

// Handle other message types
bot.on("message", async (ctx) => {
  if (!ctx.message.text) {
    await ctx.reply(
      "📝 I can only process text messages right now. Please send me a text message!",
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
  void bot.stop();
  process.exit(0);
});

process.once("SIGTERM", () => {
  console.log("Received SIGTERM. Gracefully shutting down...");
  void bot.stop();
  process.exit(0);
});

// Start the bot
async function startBot() {
  console.log("🚀 Starting Telegram bot with Claude AI and MCP integration...");
  console.log(`📡 MCP Server URL: ${BOSON_MCP_URL}`);

  try {
    mcpTools = await getDefaultTools();
    console.log(
      "✅ Default MCP tools initialized successfully (ignore the previous warning)",
    );
  } catch (error) {
    console.error("❌ Failed to initialize default MCP tools:", error);
    mcpTools = {};
  }

  await bot.start();
  console.log("✅ Bot started successfully");
}

startBot().catch(console.error);
