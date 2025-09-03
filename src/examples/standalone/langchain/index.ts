import readline from "node:readline";

import { bosonProtocolPlugin } from "@bosonprotocol/agentic-commerce";
import { BOSON_MCP_URL, CHAIN_MAP } from "@common/chains.ts";
import { getOnChainTools } from "@goat-sdk/adapter-langchain";
import { viem } from "@goat-sdk/wallet-viem";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Example test for the Boson MCP Server plugin
async function main() {
  const rawPrivateKey = process.env.PRIVATE_KEY;
  if (!rawPrivateKey) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
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

  // Validate private key length
  if (privateKey.length !== 66) {
    throw new Error(
      `Invalid private key length: expected 66 characters (0x + 64 hex), got ${privateKey.length}`,
    );
  }

  // Validate private key format
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

  // Get tools with the Boson Protocol plugin
  const tools = await getOnChainTools({
    wallet: viem(walletClient),
    plugins: [bosonProtocolPlugin({ url: bosonMcpUrl })],
  });

  // Initialize LLM
  const llm = new ChatAnthropic({
    apiKey: anthropicApiKey,
    model: "claude-4-sonnet-20250514", // change model as needed,
    temperature: 0,
  });

  // Pull the structured chat agent prompt from LangChain Hub
  // check the system prompt template here:
  // https://smith.langchain.com/hub/hwchase17/structured-chat-agent/f92e5ae4?organizationId=6e7cb68e-d5eb-56c1-8a8a-5a32467e2996
  const prompt = await pull<ChatPromptTemplate>(
    "hwchase17/structured-chat-agent",
  );

  // Create structured chat agent
  const agent = await createStructuredChatAgent({
    llm,
    tools: tools as any, // Type assertion to resolve complex type inference
    prompt,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools: tools as any,
  });

  // Initialize chat history for conversation memory
  const chatHistory: (HumanMessage | AIMessage)[] = [];

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
      const result = await agentExecutor.invoke({
        input: prompt,
        chat_history: chatHistory,
      });

      console.log("\n-------------------\n");
      console.log("RESPONSE");
      console.log("\n-------------------\n");
      console.log(result.output);

      // Add messages to chat history for context in next interaction
      chatHistory.push(new HumanMessage(prompt));
      chatHistory.push(new AIMessage(result.output));
    } catch (error) {
      console.error(error);
    }
    console.log("\n-------------------\n");
  }
  process.exit(0);
}

// Run the test
main().catch(console.error);
