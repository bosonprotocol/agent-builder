import {
  polygonAmoy,
  mainnet,
  arbitrum,
  optimism,
  baseSepolia,
  base,
  arbitrumSepolia,
  optimismSepolia,
  sepolia,
  polygon,
} from "viem/chains";
import { getEnvConfigs } from "@bosonprotocol/common";
import type { ChainId } from "@bosonprotocol/common";
// Environment variables validation
export const BOSON_MCP_URL = process.env.BOSON_MCP_URL;
export const isStaging = BOSON_MCP_URL?.includes("staging");

if (!BOSON_MCP_URL) {
  throw new Error("BOSON_MCP_URL environment variable is required");
}

if (!isStaging && !BOSON_MCP_URL?.includes("production")) {
  throw new Error(
    "BOSON_MCP_URL must include 'production' for production environment or 'staging' for staging environment"
  );
}

const ALL_CHAINS_MAP = {
  1: {
    chain: mainnet,
    rpc:
      mainnet.rpcUrls.default.http[0] ||
      "https://eth-mainnet.public.blastapi.io",
  },
  137: {
    chain: polygon,
    rpc: polygon.rpcUrls.default.http[0] || "https://polygon-rpc.com",
  }, // Polygon mainnet
  80002: {
    chain: polygonAmoy,
    rpc:
      polygonAmoy.rpcUrls.default.http[0] ||
      "https://rpc-amoy.polygon.technology",
  },
  42161: {
    chain: arbitrum,
    rpc: arbitrum.rpcUrls.default.http[0] || "https://arb1.arbitrum.io/rpc",
  },
  10: {
    chain: optimism,
    rpc: optimism.rpcUrls.default.http[0] || "https://mainnet.optimism.io",
  },
  "11155111": {
    chain: sepolia,
    rpc: sepolia.rpcUrls.default.http[0] || "https://sepolia.infura.io/v3/",
  },
  "11155420": {
    chain: optimismSepolia,
    rpc:
      optimismSepolia.rpcUrls.default.http[0] || "https://sepolia.optimism.io",
  },
  "31337": { chain: { ...mainnet, id: 31337 }, rpc: "http://localhost:8545" }, // Local Hardhat
  "421614": {
    chain: arbitrumSepolia,
    rpc:
      arbitrumSepolia.rpcUrls.default.http[0] ||
      "https://api.zan.top/arb-sepolia",
  }, // Arbitrum Sepolia
  "8453": {
    chain: base,
    rpc: base.rpcUrls.default.http[0] || "https://base.llamarpc.com",
  }, // Base mainnet
  "84532": {
    chain: baseSepolia,
    rpc:
      baseSepolia.rpcUrls.default.http[0] ||
      "https://base-sepolia.api.onfinality.io/public",
  }, // Base Sepolia
} satisfies Record<ChainId, { chain: any; rpc: string }>;
const envConfigs = getEnvConfigs(isStaging ? "staging" : "production");
export const CHAIN_MAP = Object.fromEntries(
  Object.entries(ALL_CHAINS_MAP).filter(([chainId]) =>
    envConfigs.some((config) => config.chainId.toString() === chainId)
  )
);
