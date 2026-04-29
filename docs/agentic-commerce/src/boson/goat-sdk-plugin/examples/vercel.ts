import { viem } from "@goat-sdk/wallet-viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";

import validMinimalOfferMetadata from "../../../../e2e/boson/tests/metadata/minimalOffer.json";
import { getOnChainTools } from "../adapters/vercel-ai";
import { bosonProtocolPlugin } from "../boson-protocol.plugin";
// Example test for the Boson MCP Server plugin
async function testBosonMcpServerPlugin() {
  // Initialize wallet client with private key
  const rawPrivateKey = process.env.PRIVATE_KEY;
  if (!rawPrivateKey) {
    throw new Error("PRIVATE_KEY environment variable is required");
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

  // Use testnet for development (change chain as needed)
  const chain = polygonAmoy; // or sepolia for Ethereum testnet

  // Define custom RPC URL (optional)
  const rpcUrl = process.env.RPC_URL || "https://rpc-amoy.polygon.technology";
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
      bosonProtocolPlugin({ url: "http://localhost:3000/mcp" }),
      // ...other plugins
    ],
  });

  console.log("Available tools:", Object.keys(tools));
  // Example usage of the plugin's tool
  try {
    // First, store the metadata to IPFS
    console.log("📄 Storing metadata to IPFS...");
    const storeMetadataResult = await tools.store_product_v1_metadata.execute(
      {
        ...validMinimalOfferMetadata,
        configId: "staging-80002-0",
        signerAddress: walletClient,
      },
      {
        toolCallId: "store_product_v1_metadata",
        messages: [],
      },
    );
    console.log("Metadata storage result:", storeMetadataResult);

    if (storeMetadataResult.success) {
      const metadataResponse = JSON.parse(storeMetadataResult.data as string);
      const { metadataUri, metadataHash } = metadataResponse;

      console.log("✅ Metadata stored successfully:");
      console.log("  URI:", metadataUri);
      console.log("  Hash:", metadataHash);

      // Now create the offer with the metadata URI and hash
      console.log("🎁 Creating offer...");
      const createOfferResult = await tools.create_offer.execute(
        {
          price: "1",
          sellerDeposit: "0",
          buyerCancellationPenalty: "0",
          quantityAvailable: 99,
          validFromDateInMS: Date.now(),
          validUntilDateInMS: Date.now() + 1000 * 60 * 60 * 24, // 1 day
          voucherRedeemableFromDateInMS: Date.now(),
          voucherRedeemableUntilDateInMS: 0,
          disputePeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
          voucherValidDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
          resolutionPeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
          metadataUri,
          metadataHash,
        },
        {
          toolCallId: "create_offer",
          messages: [],
        },
      );
      console.log("✅ Offer created successfully:", createOfferResult);
    } else {
      console.error("❌ Failed to store metadata:", storeMetadataResult);
    }
  } catch (error) {
    console.error("Error executing tool:", error);
  }
  process.exit(0);
}

// Run the test
testBosonMcpServerPlugin().catch(console.error);
