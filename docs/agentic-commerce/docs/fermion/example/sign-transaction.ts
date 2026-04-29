import { ethers } from "ethers";

interface TransactionRequest {
  to?: string;
  from?: string;
  value?: string | number;
  data?: string;
  gasLimit?: string | number;
  gasPrice?: string | number;
  maxFeePerGas?: string | number;
  maxPriorityFeePerGas?: string | number;
  nonce?: number;
  type?: number;
  chainId?: number;
}

async function signTransaction(
  transactionData: TransactionRequest,
  privateKey: string,
  rpcUrl?: string,
): Promise<string> {
  try {
    const wallet = new ethers.Wallet(privateKey);

    // Auto-fetch missing values from RPC if URL is provided
    if (rpcUrl) {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Fetch nonce if not provided
      if (transactionData.nonce === undefined) {
        const connectedWallet = wallet.connect(provider);
        transactionData.nonce = await connectedWallet.getTransactionCount();
      }

      // Fetch gas price if not provided
      if (transactionData.gasPrice === undefined) {
        const gasPriceBigNumber = await provider.getGasPrice();
        transactionData.gasPrice = gasPriceBigNumber.toHexString();
      }

      // Estimate gas limit if not provided
      if (transactionData.gasLimit === undefined) {
        const estimatedGas = await provider.estimateGas({
          ...transactionData,
          from: wallet.address,
        });
        transactionData.gasLimit = estimatedGas.toHexString();
      }
    }

    const signedTransaction = await wallet.signTransaction(transactionData);
    return signedTransaction;
  } catch (error) {
    throw new Error(
      `Failed to sign transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export { signTransaction, TransactionRequest };
