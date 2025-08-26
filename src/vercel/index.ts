import readline from "node:readline";
import { createAnthropic } from "@ai-sdk/anthropic";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";
import { generateText } from "ai";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bosonProtocolPlugin } from "@bosonprotocol/agentic-commerce";
import { BOSON_MCP_URL, CHAIN_MAP } from "./chains";

// Example test for the Boson MCP Server plugin
async function testBosonMcpServerPlugin() {
  // Initialize wallet client with private key
  const rawPrivateKey = process.env.PRIVATE_KEY;
  if (!rawPrivateKey) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }
  const anthopicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthopicApiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  const bosonMcpUrl = BOSON_MCP_URL;
  if (!bosonMcpUrl) {
    throw new Error("BOSON_MCP_URL environment variable is required");
  }

  // Ensure private key has 0x prefix and is the correct length
  const privateKey = rawPrivateKey.startsWith("0x")
    ? rawPrivateKey
    : `0x${rawPrivateKey}`;

  // Validate private key format
  if (privateKey.length !== 66) {
    // 0x + 64 hex characters = 66 total
    throw new Error(
      `Invalid private key length: expected 66 characters (0x + 64 hex), got ${privateKey.length}`
    );
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("Invalid private key format: must be hex string");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  // Use first supported chain from the CHAIN_MAP which depends on the BOSON_MCP_URL and hence its environment
  const chainConfig = Object.values(CHAIN_MAP)[0];
  const chain = chainConfig.chain;

  // Define custom RPC URL (optional)
  const rpcUrl = chainConfig.rpc;
  console.log("Using RPC URL:", rpcUrl);

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  // Check wallet balance before proceeding
  console.log("Wallet address:", account.address);
  console.log("Chain:", chain.name, "ID:", chain.id);

  // Check balance using a public client
  const { createPublicClient } = await import("viem");
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const balance = await publicClient.getBalance({ address: account.address });

  if (balance === 0n) {
    console.error("❌ Wallet has no MATIC tokens!");
    console.log("🚰 Get test MATIC from: https://faucet.polygon.technology/");
    console.log("💳 Your address:", account.address);
    process.exit(1);
  }

  // Get tools with the Boson MCP Server plugin
  const tools = await getOnChainTools({
    wallet: viem(walletClient),
    plugins: [
      bosonProtocolPlugin({ url: bosonMcpUrl }),
      // ...other plugins
    ],
  });

  console.log("Available tools:", Object.keys(tools));
  const anthropic = createAnthropic({
    apiKey: anthopicApiKey,
  });
  // Example usage of the plugin's tool
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const prompt = await new Promise<string>((resolve) => {
      rl.question('Enter your prompt (or "exit" to quit): ', resolve);
    });

    if (prompt === "exit") {
      rl.close();
      break;
    }

    console.log("\n-------------------\n");
    console.log("TOOLS CALLED");
    console.log("\n-------------------\n");
    try {
      const result = await generateText({
        model: anthropic("claude-4-sonnet-20250514"), // change model as needed
        tools: tools,
        maxSteps: 10, // Maximum number of tool invocations per request
        prompt: prompt,
        onStepFinish: (event) => {
          console.log(event.toolResults);
        },
      });

      console.log("\n-------------------\n");
      console.log("RESPONSE");
      console.log("\n-------------------\n");
      console.log(result.text);
    } catch (error) {
      console.error(error);
    }
    console.log("\n-------------------\n");
  }
  process.exit(0);
}

// Run the test
testBosonMcpServerPlugin().catch(console.error);
