/**
 * Create an entity for a given wallet, with Seller, Verifier and Custodian roles.
 * This would allow to create an offer, reusing the same entity as Verifier and Custody.
 * 
 * This script can be run using ts-node: 
 * > npx ts-node runit.ts -- createSellerEntity
 */

import { EthersAdapter } from "@bosonprotocol/ethers-sdk";
import { providers, Wallet } from "ethers";
import {
  EnvironmentType,
  ConfigId,
  getEnvConfigById,
  eEntityRole,
  TransactionRequest
} from "@fermionprotocol/common";
import { BaseEntity, CoreSDK } from "@fermionprotocol/core-sdk";

const context = {
  // EnvironmentType of the Local Environment
  envName: "local" as EnvironmentType,
  // ConfigId of the Local Environment
  configId: "local-31337-0" as ConfigId,
  // One of the pre-funded accounts in the Local Environment
  // (https://github.com/fermionprotocol/contracts/blob/main/e2e/accounts.ts)
  privateKey: "0xa2e78cd4c87191e50d6a8f1610b1cf160b17216e9090dde7a92960a34c310482"
};

// The roles the Seller Entity should have to be able to create offers without any need for other entities
const sellerRoles = [eEntityRole.Seller, eEntityRole.Verifier, eEntityRole.Custodian];

export async function createSellerEntity() {
  // Create the wallet (using ethers.js v5*)
  const wallet = new Wallet(context.privateKey);
  // Create the Fermion CoreSDK with the default config for the given envName/configId
  const defaultConfig = getEnvConfigById(context.envName, context.configId);
  const coreSDK = CoreSDK.fromDefaultConfig({
    web3Lib: new EthersAdapter(
      new providers.JsonRpcProvider(defaultConfig.jsonRpcUrl),
      wallet
    ),
    envName: context.envName,
    configId: context.configId
  });
  // Check if an entity already exists for the given wallet
  const baseEntities = await coreSDK.getBaseEntities({
    baseEntitiesFilter: { adminAccount: wallet.address.toLowerCase() }
  });
  if (baseEntities?.length) {
    console.log(
      `BaseEntity already exists for wallet ${wallet.address}: ${JSON.stringify(baseEntities)}`
    );
    return;
  }
  // Create an Entity with required roles
  const tx = await coreSDK.createEntity(
    {
      roles: sellerRoles,
      metadataURI: "",
    }
  );
  console.log(`Transaction submitted: ${tx.hash} ...`);
  // Wait for the transaction to be confirmed
  const txReceipt = await tx.wait();
  // Get the entityId for the created entity
  const entityId = coreSDK.getCreatedEntityIdFromLogs(txReceipt.logs);
  console.log(`Entity created with id '${entityId}'`);
  // Wait for the subgraph to be updated
  console.log(`Wait for the subgraph to update...`);
  await coreSDK.waitForGraphNodeIndexing(tx);
  // Extract the data about the entity
  const entity = await coreSDK.getEntity(entityId);
  console.log(`${JSON.stringify(entity)}`);
}

export async function checkSellerEntity(wallet: Wallet): Promise<BaseEntity> {
  // Create the Fermion CoreSDK with the default config for the given envName/configId
  const defaultConfig = getEnvConfigById(context.envName, context.configId);
  const coreSDK = CoreSDK.fromDefaultConfig({
    web3Lib: new EthersAdapter(
      new providers.JsonRpcProvider(defaultConfig.jsonRpcUrl),
      wallet
    ),
    envName: context.envName,
    configId: context.configId
  });
  // Ensure the given wallet has an Entity with required roles Seller + Verifier + Custodian
  const [sellerEntity] = await coreSDK.getBaseEntities({
    baseEntitiesFilter: { adminAccount: wallet.address.toLowerCase() }
  });
  if (!sellerEntity) {
    throw new Error(`No entity exists for the given wallet ${wallet.address}`);
  }
  if (!sellerEntity.roles?.includes(eEntityRole.Seller) && sellerRoles.includes(eEntityRole.Seller)) {
    throw new Error(`Entity created with wallet ${wallet.address} is not a Seller`);
  }
  if (!sellerEntity.roles?.includes(eEntityRole.Verifier) && sellerRoles.includes(eEntityRole.Verifier)) {
    throw new Error(`Entity created with wallet ${wallet.address} is not a Verifier`);
  }
  if (!sellerEntity.roles?.includes(eEntityRole.Custodian) && sellerRoles.includes(eEntityRole.Custodian)) {
    throw new Error(`Entity created with wallet ${wallet.address} is not a Custodian`);
  }
  return sellerEntity;
}
