#!/usr/bin/env ts-node

// Usage:
// # CLI mode
// npx ts-node scripts/sign-transaction.ts sign \
//   --private-key "0x..." \
//   --to "0x742d35Cc6634C0532925a3b8D91319Fd" \
//   --value "1000000000000000000" \
//   --data "0x..." \
//   --gas-limit "21000"
// # JSON mode
// npx ts-node scripts/sign-transaction.ts sign-json \
//   --private-key "0x..." \
//   --json '{"to":"0x742d35Cc...","value":"1000000000000000000"}'

import { program } from "commander";
import { signTransaction, TransactionRequest } from "../docs/fermion/example/sign-transaction";

program
  .name("sign-transaction")
  .description("Sign a transaction using a private key")
  .version("1.0.0")
  .command("sign")
  .description("Sign transaction data")
  .requiredOption("-k, --private-key <key>", "Private key to sign with")
  .requiredOption("-t, --to <address>", "Recipient address")
  .option("-v, --value <value>", "Value to send (in wei)", "0")
  .option("-d, --data <data>", "Transaction data", "0x")
  .option("-g, --gas-limit <limit>", "Gas limit")
  .option("-p, --gas-price <price>", "Gas price (in wei)")
  .option("--max-fee-per-gas <fee>", "Max fee per gas (EIP-1559)")
  .option(
    "--max-priority-fee-per-gas <fee>",
    "Max priority fee per gas (EIP-1559)",
  )
  .option("-n, --nonce <nonce>", "Transaction nonce", parseInt)
  .option("-c, --chain-id <id>", "Chain ID", parseInt)
  .option("--type <type>", "Transaction type (0, 1, or 2)", parseInt)
  .option(
    "-r, --rpc-url <url>",
    "RPC URL to fetch nonce and gas price automatically",
  )
  .action(async (options) => {
    try {
      const transactionData: TransactionRequest = {
        to: options.to,
        value: options.value,
        data: options.data,
      };

      if (options.gasLimit) transactionData.gasLimit = options.gasLimit;
      if (options.gasPrice) transactionData.gasPrice = options.gasPrice;
      if (options.maxFeePerGas)
        transactionData.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas)
        transactionData.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) transactionData.nonce = options.nonce;
      if (options.chainId !== undefined)
        transactionData.chainId = options.chainId;
      if (options.type !== undefined) transactionData.type = options.type;

      const signedTransaction = await signTransaction(
        transactionData,
        options.privateKey,
        options.rpcUrl,
      );

      console.log(
        JSON.stringify(
          {
            success: true,
            signedTransaction,
            transactionData,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(
        JSON.stringify(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          null,
          2,
        ),
      );
      process.exit(1);
    }
  });

program
  .command("sign-json")
  .description("Sign transaction from JSON input")
  .requiredOption("-k, --private-key <key>", "Private key to sign with")
  .requiredOption("-j, --json <json>", "Transaction data as JSON string")
  .option(
    "-r, --rpc-url <url>",
    "RPC URL to fetch nonce and gas price automatically",
  )
  .action(async (options) => {
    try {
      const transactionData: TransactionRequest = JSON.parse(options.json);

      const signedTransaction = await signTransaction(
        transactionData,
        options.privateKey,
        options.rpcUrl,
      );

      console.log(
        JSON.stringify(
          {
            success: true,
            signedTransaction,
            transactionData,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(
        JSON.stringify(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          null,
          2,
        ),
      );
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

