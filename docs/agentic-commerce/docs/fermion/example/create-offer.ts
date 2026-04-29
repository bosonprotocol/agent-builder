/**
 * Create an offer for a given entity identified with a given wallet.
 *
 * This script can be run using ts-node:
 * > npx ts-node runit.ts -- createOffer
 */

import { Interface } from "@ethersproject/abi";
import { Wallet } from "ethers";
import {
  EnvironmentType,
  ConfigId,
  TransactionRequest,
  Log,
  abis,
} from "@fermionprotocol/common";
import { createMcpClient } from "./create-mcp-client";
import { checkSellerEntity } from "./seller-entity-creation";
import { ReturnTypeMcp } from "../../../src/common/mcp-server/mcpTypes";
import { signTransaction } from "./sign-transaction";

const context = {
  // EnvironmentType of the Local Environment
  envName: "local" as EnvironmentType,
  // ConfigId of the Local Environment
  configId: "local-31337-0" as ConfigId,
  // One of the pre-funded accounts in the Local Environment (https://github.com/fermionprotocol/contracts/blob/main/e2e/accounts.ts)
  privateKey:
    "0xa2e78cd4c87191e50d6a8f1610b1cf160b17216e9090dde7a92960a34c310482",
  // Local Environment RPC Node
  rpcNode: "http://localhost:8545",
  // ERC20 token deployed on Local Environment
  exchangeToken: "0x82e01223d51Eb87e16A03E24687EDF0F294da6f1",
};

const offerMetadata = {
  schemaUrl: "https://json-schema.org",
  type: "FERMION_OFFER",
  uuid: "ecf2a6dc-555b-41b5-aca8-b7e29eebbb30",
  name: "Boson X MetaFactory Hoodie",
  description:
    "The future is here and it starts with a limited edition MetaFactory X Boson Protocol Hoodie... This unisex hoodie, in a metablack coloureway with reflective stripes, is made from a heavyweight French terry cotton. It has an adjustable hood and full colour interior, elasticated trims, reflective lining, and reflective back panels... Nothing says open metaverse more than this collab between MetaFactory and Boson Protocol. Limited Edition: Only 75 ever made.",
  externalUrl:
    "https://app.bosonportal.io/#/offer-uuid/ecf2a6dc-555b-41b5-aca8-b7e29eebbb30",
  licenseUrl:
    "https://app.bosonportal.io/#/license/ecf2a6dc-555b-41b5-aca8-b7e29eebbb30",
  image:
    "https://bsn-portal-production-image-upload-storage.s3.amazonaws.com/fc11acc4-e27b-4ede-b7d3-f16735fab406",
  attributes: [] as unknown[],
  product: {
    uuid: "77593bb2-f797-11ec-b939-0242ac120002",
    version: 1,
    title: "Boson X MetaFactory Hoodie",
    description:
      "The future is here and it starts with a limited edition MetaFactory X Boson Protocol Hoodie... This unisex hoodie, in a metablack coloureway with reflective stripes, is made from a heavyweight French terry cotton. It has an adjustable hood and full colour interior, elasticated trims, reflective lining, and reflective back panels... Nothing says open metaverse more than this collab between MetaFactory and Boson Protocol. Limited Edition: Only 75 ever made.",
    productionInformation_brandName: "Boson X MetaFactory",
    details_offerCategory: "PHYSICAL",
    condition: {
      value: "new",
    },
    category: {
      value: "fashion",
    },
    visuals_images: [
      {
        url: "https://bsn-portal-production-image-upload-storage.s3.amazonaws.com/5ba6461b-e4b4-444d-90bf-0c9de1835c35",
      },
    ],
  },
  shipping: {
    returnPolicy: {
      url: "https://example.com/return-policy",
    },
    methods: [
      {
        value: "pickup",
      },
    ],
  },
};

const offerParams = {
  exchangeToken: context.exchangeToken,
  sellerDeposit: "0",
  verifierFee: "0",
  custodianFee: {
    amount: 0,
    period: 3600 * 24 * 30,
  },
  facilitatorFeePercent: 0,
  ...offerMetadata,
};

export async function createOffer() {
  // Create the wallet (using ether.js v5*)
  const wallet = new Wallet(context.privateKey);
  // Check the seller Entity exists
  const { entityId: sellerId } = await checkSellerEntity(wallet);
  // Create the MCP Client
  const mcpClient = await createMcpClient(false);
  // Call the "initialize_sdk" tool first
  await mcpClient.callTool({
    name: "initialize_sdk",
    arguments: {
      configId: context.configId,
      signerAddress: wallet.address,
    },
  });
  // Call the "create_offer" tool
  const createOfferResult = await mcpClient.callTool({
    name: "create_offer",
    arguments: {
      sellerId,
      facilitatorId: sellerId,
      verifierId: sellerId,
      custodianId: sellerId,
      ...offerParams,
    },
  });
  // Extract the TransactionData from the tool result
  const { transactionData } = getContent<{
    transactionData: Pick<TransactionRequest, "to" | "data">;
  }>(createOfferResult as ReturnTypeMcp);
  // Build and sign the blockchain transaction
  const signedTransaction = await signTransaction(
    transactionData,
    context.privateKey,
    context.rpcNode,
  );
  // Send the signed transaction calling the "send_signed_transaction" tool
  const sendSignedTransactionResult = await mcpClient.callTool({
    name: "send_signed_transaction",
    arguments: {
      signedTransaction,
    },
  });
  // Extract the TransactionReceipt from the tool result
  const { logs, hash } = getContent<{
    hash: string;
    logs: Log[];
    blockNumber: number;
  }>(sendSignedTransactionResult as ReturnTypeMcp);
  // Find the offerId from the transaction Logs
  const abi = new Interface(abis.IOfferEventsABI);
  const [offerId] = logs
    .map((log) => {
      try {
        return abi.parseLog(log);
      } catch (error) {
        // assume that failing to parse is irrelevant log
        return null;
      }
    })
    .filter((log) => log !== null)
    .filter((log) => log.name === "OfferCreated")
    .map((log) => log.args["bosonOfferId"]);
  if (!offerId) {
    throw new Error(
      `Unable to retrieve the offerId from transation logs (hash: ${hash})`,
    );
  }
  console.log(`Offer ${offerId} has been successfully created`);
}

function getContent<T>(toolResult: ReturnTypeMcp): T {
  const contentText = toolResult?.content?.[0]?.text;
  if (!contentText) {
    throw new Error(
      `Invalid return content from tool: ${JSON.stringify(toolResult)}`,
    );
  }
  let contentJson;
  try {
    contentJson = JSON.parse(contentText);
  } catch (e) {
    console.error(
      `Unable to parse JSON from ${contentText}. Error: ${e.toString()}`,
    );
  }
  if (!contentJson.success) {
    throw new Error(`Unsuccessful return from tool: ${contentText}`);
  }
  return contentJson as T;
}
