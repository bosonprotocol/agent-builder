import readline from "node:readline";

import { createAnthropic } from "@ai-sdk/anthropic";
import { bosonProtocolPlugin } from "@bosonprotocol/agentic-commerce";
import { BOSON_MCP_URL, CHAIN_MAP } from "@common/chains.ts";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";
import { generateText } from "ai";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { sendEmailTool } from "./tools.ts";

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
      `Invalid private key length: expected 66 characters (0x + 64 hex), got ${privateKey.length}`,
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
  const bosonTools = await getOnChainTools({
    wallet: viem(walletClient),
    plugins: [bosonProtocolPlugin({ url: bosonMcpUrl })],
  });

  const tools = {
    ...bosonTools,
    sendEmailTool,
  };

  console.log("Available tools:", Object.keys(tools));
  const anthropic = createAnthropic({
    apiKey: anthopicApiKey,
  });

  let conversationHistory: Parameters<typeof generateText>[0]["messages"] = [];
  while (true) {
    const prompt = await multilineInput("Enter your prompt:");

    if (prompt === null) {
      console.log("Input cancelled.");
      return;
    }

    if (prompt === "exit") {
      break;
    }
    conversationHistory.push({ role: "user" as const, content: prompt });
    console.log("\n-------------------\n");
    console.log("TOOLS CALLED");
    console.log("\n-------------------\n");
    try {
      const result = await generateText({
        model: anthropic("claude-4-sonnet-20250514"), // change model as needed
        tools: tools,
        maxSteps: 20, // Maximum number of tool invocations per request
        messages: conversationHistory,
        system: `You are an AI agent responsible for communicating with sellers and dispute resolvers on behalf of a buyer.
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
`,
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
