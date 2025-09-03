import readline from "node:readline";

import { createAnthropic } from "@ai-sdk/anthropic";
import { bosonProtocolPlugin } from "@bosonprotocol/agentic-commerce";
import { BOSON_MCP_URL, CHAIN_MAP } from "@common/chains.ts";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";
import { generateText } from "ai";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

async function multilineInput(message: string): Promise<string | null> {
  console.log(message);
  console.log('(Enter your text line by line. Type "DONE" to finish)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: undefined, // Don't pass output to prevent automatic echoing
    terminal: false,
  });

  return new Promise((resolve) => {
    const lines: string[] = [];

    rl.on("line", (line) => {
      if (line.trim().toLowerCase() === "done") {
        rl.close();
        resolve(lines.join("\n"));
      } else {
        lines.push(line);
      }
    });

    rl.on("SIGINT", () => {
      console.log("\nInput cancelled.");
      rl.close();
      resolve(null);
    });
  });
}

async function main() {
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
  const chainId = process.env.CHAIN_ID;
  if (!chainId) {
    throw new Error("CHAIN_ID environment variable is required");
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

  const chainConfig = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chainConfig) {
    throw new Error(`Unsupported CHAIN_ID: ${chainId}`);
  }
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
    console.error("❌ Wallet has no balance!");
    console.log("💳 Your address:", account.address);
    process.exit(1);
  }

  // Get tools with the Boson MCP Server plugin
  const tools = await getOnChainTools({
    wallet: viem(walletClient),
    plugins: [
      bosonProtocolPlugin({
        url: bosonMcpUrl,
      }),
      // ...other plugins
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any[], // to avoid error TS2589: Type instantiation is excessively deep and possibly infinite.
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

  let conversationHistory: Parameters<typeof generateText>[0]["messages"] = [];
  let system: string | undefined = undefined;
  let parameters: string | undefined = undefined;

  while (true) {
    const prompt = await multilineInput("Enter your prompt:");

    if (prompt === null) {
      console.log("Input cancelled.");
      return;
    }

    if (prompt === "exit") {
      break;
    }

    conversationHistory.push({
      role: "user" as const,
      content: `${prompt}${parameters ? `\n\nParameters: ${parameters}` : ""}`,
    });
    if (prompt.startsWith("/system:")) {
      system = prompt.replace("/system:", "").trim();
      console.log("System prompt set.");
      continue;
    }
    if (prompt.startsWith("/parameters:")) {
      parameters = prompt.replace("/parameters:", "").trim();
      console.log("Parameters set.");
      continue;
    }

    console.log("\n-------------------\n");
    console.log("TOOLS CALLED");
    console.log("\n-------------------\n");
    try {
      const result = await generateText({
        model: anthropic("claude-4-sonnet-20250514"), // change model as needed
        tools: tools,
        messages: conversationHistory,
        maxSteps: 20, // Maximum number of tool invocations per request
        system: system,
        onStepFinish: (event) => {
          console.log(event.toolResults);
        },
      });

      console.log("\n-------------------\n");
      console.log("RESPONSE");
      console.log("\n-------------------\n");
      console.log(result.text);
      conversationHistory.push({
        role: "assistant" as const,
        content: result.text,
      });
      if (conversationHistory.length > 10) {
        // remove "if", if you need the model to keep a longer conversation in memory
        conversationHistory = conversationHistory.slice(-10);
      }
    } catch (error) {
      console.error(error);
    }
    console.log("\n-------------------\n");
  }
  process.exit(0);
}

// Run the test
main().catch(console.error);
