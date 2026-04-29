/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthTokenType,
  EvaluationMethod,
  GatingType,
  TokenType,
} from "@bosonprotocol/common";
import { CoreSDK, subgraph } from "@bosonprotocol/core-sdk";
import { OfferFieldsFragment } from "@bosonprotocol/core-sdk/src/subgraph";
import { ethers, Wallet } from "ethers";

import { ReturnTypeMcp } from "../../../src/common";
import { mcpServerUrl } from "../../common/constants";
import { provider } from "../../common/protocol-utils";
import {
  getSignatureData,
  resultIsSuccessful,
  signAndSendTransactionData,
} from "../../common/test-utils";
import {
  ensureMintedAndAllowedTokens,
  initCoreSDKWithFundedWallet,
  storeProductV1Metadata,
} from "./boson-utils";
import { MOCK_ERC20_ADDRESS } from "./constants";
import { BosonMCPClient } from "./mcp-client";
import minimalOfferMetadata from "./metadata/minimalOffer.json";

jest.setTimeout(90_000); // Extended timeout for complex workflows

const TEST_KEY = 3; // must be unique per test file
const TEST_KEY_BUYER = 4; // must be unique per test file
const LONG_OFFER_VALIDITY_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;

describe("Boson MCP Server - Complete Marketplace Journeys", () => {
  let sellerCoreSdk: CoreSDK;
  let sellerWallet: Wallet;
  let buyerCoreSdk: CoreSDK;
  let buyerWallet: Wallet;
  let mcpClient: BosonMCPClient;
  let sellerId: string;
  let metadataUri: string;
  let metadataHash: string;

  beforeAll(async () => {
    ({ coreSDK: sellerCoreSdk, fundedWallet: sellerWallet } =
      await initCoreSDKWithFundedWallet(TEST_KEY));

    // Create a separate buyer wallet
    ({ coreSDK: buyerCoreSdk, fundedWallet: buyerWallet } =
      await initCoreSDKWithFundedWallet(TEST_KEY_BUYER));

    // Setup MCP client and create seller
    mcpClient = new BosonMCPClient();
    await mcpClient.connectToServer(mcpServerUrl);

    const createSellerResult = await mcpClient.createSeller({
      admin: sellerWallet.address,
      assistant: sellerWallet.address,
      treasury: sellerWallet.address,
      authTokenId: "0",
      authTokenType: AuthTokenType.NONE,
      contractUri: "",
      royaltyPercentage: "0",
      type: "SELLER",
      kind: "lens",
      contactPreference: "xmtp",
      configId: "local-31337-0",
      signerAddress: sellerWallet.address,
    });

    resultIsSuccessful(createSellerResult, /"success": true/);

    let createSellerReceipt;
    await signAndSendTransactionData(
      createSellerResult,
      mcpClient,
      sellerWallet,
      (_receipt) => (createSellerReceipt = _receipt),
      "local-31337-0",
    );

    const { logs } = createSellerReceipt;
    sellerId = sellerCoreSdk.getCreatedSellerIdFromLogs(logs)?.toString() || "";
    expect(sellerId).toBeTruthy();

    // Wait for subgraph to index
    const { blockNumber } = createSellerReceipt;
    await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);

    // Create shared metadata for marketplace tests
    ({ metadataUri, metadataHash } = await storeProductV1Metadata(mcpClient, {
      ...minimalOfferMetadata,
      configId: "local-31337-0",
      signerAddress: sellerWallet.address,
    }));
  });

  afterAll(async () => {
    if (mcpClient) {
      await mcpClient.disconnect();
    }
  });

  describe("Simple Purchase Journey", () => {
    let offerId: string;
    let exchangeId: string;

    test("create simple offer", async () => {
      // Use early timestamp to avoid blockchain time issues
      const validFromTime = 1577836800000; // January 1, 2020 00:00:00 UTC
      const currentBlock = await provider.getBlock("latest");
      const blockTime = currentBlock.timestamp * 1000;

      const createOfferResult = await mcpClient.createOffer({
        price: "5000000",
        sellerDeposit: "0",
        buyerCancellationPenalty: "250000",
        quantityAvailable: 10,
        validFromDateInMS: validFromTime,
        validUntilDateInMS: blockTime + 1000 * 60 * 60 * 24, // 1 day
        voucherRedeemableFromDateInMS: validFromTime,
        voucherRedeemableUntilDateInMS: 0,
        disputePeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        voucherValidDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        resolutionPeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        metadataUri,
        metadataHash,
        configId: "local-31337-0",
        signerAddress: sellerWallet.address,
      });

      resultIsSuccessful(createOfferResult, /"success": true/);

      let createOfferReceipt: any;
      await signAndSendTransactionData(
        createOfferResult,
        mcpClient,
        sellerWallet,
        (_receipt) => (createOfferReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = createOfferReceipt;
      offerId = sellerCoreSdk.getCreatedOfferIdFromLogs(logs)!;
      expect(offerId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = createOfferReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
    });

    test("buyer commits to offer", async () => {
      const commitResult = await mcpClient.commitToOffer({
        offerId,
        buyer: buyerWallet.address,
        configId: "local-31337-0",
        signerAddress: buyerWallet.address,
      });

      resultIsSuccessful(commitResult, /"success": true/);

      let commitReceipt: any;
      await signAndSendTransactionData(
        commitResult,
        mcpClient,
        buyerWallet,
        (_receipt) => (commitReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = commitReceipt;
      exchangeId =
        sellerCoreSdk.getCommittedExchangeIdFromLogs(logs)?.toString() || "";
      expect(exchangeId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = commitReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
    });

    test("complete purchase with voucher redemption", async () => {
      // Redeem voucher (buyer action)
      const redeemResult = await mcpClient.redeemVoucher({
        exchangeId,
        configId: "local-31337-0",
        signerAddress: buyerWallet.address,
      });

      resultIsSuccessful(redeemResult, /"success": true/);

      let redeemReceipt: any;
      await signAndSendTransactionData(
        redeemResult,
        mcpClient,
        buyerWallet,
        (_receipt) => (redeemReceipt = _receipt),
        "local-31337-0",
      );

      // Wait for subgraph to index
      const { blockNumber } = redeemReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);

      // Verify exchange state
      const exchange = await sellerCoreSdk.getExchangeById(exchangeId);
      expect(exchange.state).toBe(subgraph.ExchangeState.REDEEMED);
      expect(exchange.buyer.wallet.toLowerCase()).toBe(
        buyerWallet.address.toLowerCase(),
      );
    });
  });

  describe("Buyer-initiated Offer Journey", () => {
    let offerId: string;
    let exchangeId: string;

    test("create buyer-initiated offer", async () => {
      // Use early timestamp to avoid blockchain time issues
      const validFromTime = 1577836800000; // January 1, 2020 00:00:00 UTC
      const currentBlock = await provider.getBlock("latest");
      const blockTime = currentBlock.timestamp * 1000;

      const createOfferResult = await mcpClient.createOffer({
        creator: "BUYER",
        price: "5000000",
        sellerDeposit: "0",
        buyerCancellationPenalty: "250000",
        quantityAvailable: 1,
        validFromDateInMS: validFromTime,
        validUntilDateInMS: blockTime + 1000 * 60 * 60 * 24, // 1 day
        voucherRedeemableFromDateInMS: validFromTime,
        voucherRedeemableUntilDateInMS: 0,
        disputePeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        voucherValidDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        resolutionPeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        metadataUri,
        metadataHash,
        configId: "local-31337-0",
        signerAddress: buyerWallet.address,
      });

      resultIsSuccessful(createOfferResult, /"success": true/);

      let createOfferReceipt: any;
      await signAndSendTransactionData(
        createOfferResult,
        mcpClient,
        sellerWallet,
        (_receipt) => (createOfferReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = createOfferReceipt;
      offerId = sellerCoreSdk.getCreatedOfferIdFromLogs(logs)!;
      expect(offerId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = createOfferReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
    });

    test("buyer deposits offer price", async () => {
      expect(offerId).toBeTruthy();
      const getOffersResult = await mcpClient.getOffers({
        configId: "local-31337-0",
        offersFilter: { id: offerId },
      });
      expect(getOffersResult).toBeTruthy();
      expect(getOffersResult.content).toBeTruthy();
      const offersData = JSON.parse((getOffersResult.content as any)[0].text);
      expect(offersData).toBeTruthy();
      expect(Array.isArray(offersData)).toBe(true);
      expect(offersData.length).toEqual(1);
      const [offer] = offersData as OfferFieldsFragment[];
      expect(offer).toBeTruthy();
      expect(offer.buyer).toBeTruthy();
      await ensureMintedAndAllowedTokens([buyerWallet], offer.price);

      const depositResult = await mcpClient.depositFunds({
        entityId: (offer.buyer as { id: string }).id,
        amount: offer.price,
        tokenAddress: offer.exchangeToken.address,
        configId: "local-31337-0",
        signerAddress: buyerWallet.address,
      });
      resultIsSuccessful(depositResult, /"success": true/);
      let depositReceipt: any;
      await signAndSendTransactionData(
        depositResult,
        mcpClient,
        sellerWallet,
        (_receipt) => (depositReceipt = _receipt),
        "local-31337-0",
      );
      expect(depositReceipt).toBeTruthy();
      expect(depositReceipt.hash).toBeTruthy();
    });

    test("seller commits to offer", async () => {
      const commitResult = await mcpClient.commitToBuyerOffer({
        offerId,
        configId: "local-31337-0",
        signerAddress: sellerWallet.address,
      });

      resultIsSuccessful(commitResult, /"success": true/);

      let commitReceipt: any;
      await signAndSendTransactionData(
        commitResult,
        mcpClient,
        sellerWallet,
        (_receipt) => (commitReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = commitReceipt;
      exchangeId =
        sellerCoreSdk.getCommittedExchangeIdFromLogs(logs)?.toString() || "";
      expect(exchangeId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = commitReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
    });
  });

  describe("Non listed offers", () => {
    let fullOfferBase: any;
    beforeAll(async () => {
      const validFromTime = 1577836800000; // January 1, 2020 00:00:00 UTC
      const currentBlock = await provider.getBlock("latest");
      const blockTime = currentBlock.timestamp * 1000;
      fullOfferBase = {
        creator: "SELLER",
        seller: sellerId,
        price: "5000000",
        // price: "0xinvalid",
        sellerDeposit: "0",
        buyerCancellationPenalty: "250000",
        quantityAvailable: 2,
        validFromDateInMS: validFromTime,
        validUntilDateInMS: blockTime + 1000 * 60 * 60 * 24, // 1 day
        voucherRedeemableFromDateInMS: validFromTime,
        voucherRedeemableUntilDateInMS: 0,
        disputePeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        voucherValidDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        resolutionPeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        metadataUri,
        metadataHash,
        useDepositedFunds: true,
      } as const;
    });
    describe("Seller initiated offer", () => {
      let offerId: string;
      let exchangeId: string;
      let fullOffer: any;
      beforeAll(() => {
        fullOffer = {
          ...fullOfferBase,
          offerCreator: sellerWallet.address,
          committer: buyerWallet.address,
          buyerId: "0",
          sellerId,
        };
      });

      // Offer creator is the seller, which has to provide the buyer with the full offer signature
      // so that the buyer can call createOfferAndCommit
      test("create non listed offer and commit", async () => {
        const offerArgs = {
          ...fullOffer,
          configId: "local-31337-0",
          signerAddress: sellerWallet.address,
        };
        const signFullOfferResult = await mcpClient.signFullOffer({
          ...offerArgs,
        });
        resultIsSuccessful(signFullOfferResult, /"success": true/);
        const signatureData = getSignatureData(
          signFullOfferResult as ReturnTypeMcp,
        );
        if (signatureData.types && signatureData.types.EIP712Domain) {
          delete (signatureData.types as any).EIP712Domain; // we don't need to hash the domain
        }
        const signature = await sellerWallet._signTypedData(
          signatureData.domain,
          signatureData.types,
          signatureData.message,
        );
        const commitResult = await mcpClient.createOfferAndCommit({
          ...offerArgs,
          signature,
          signerAddress: buyerWallet.address,
        });
        resultIsSuccessful(commitResult, /"success": true/);

        let commitReceipt: any;
        await signAndSendTransactionData(
          commitResult,
          mcpClient,
          buyerWallet,
          (_receipt) => (commitReceipt = _receipt),
          "local-31337-0",
        );

        const { logs } = commitReceipt;
        exchangeId =
          sellerCoreSdk.getCommittedExchangeIdFromLogs(logs)?.toString() || "";
        expect(exchangeId).toBeTruthy();

        // Wait for subgraph to index
        const { blockNumber } = commitReceipt;
        await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
      });
      test("seller can void the offer before the first commit (calling voidNonListedOffer)", async () => {
        const offerArgs = {
          ...fullOffer,
          name: "Offer to be voided",
          description: "This offer will be voided",
          configId: "local-31337-0",
          signerAddress: sellerWallet.address,
        };
        const voidResult = await mcpClient.voidNonListedOffer({
          ...offerArgs,
        });
        resultIsSuccessful(voidResult, /"success": true/);
        let voidReceipt: any;
        await signAndSendTransactionData(
          voidResult,
          mcpClient,
          sellerWallet,
          (_receipt) => (voidReceipt = _receipt),
          "local-31337-0",
        );
        expect(voidReceipt).toBeTruthy();
        // Wait for subgraph to index
        const { blockNumber } = voidReceipt;
        await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
        const signFullOfferResult = await mcpClient.signFullOffer({
          ...offerArgs,
        });
        resultIsSuccessful(signFullOfferResult, /"success": true/);
        const signatureData = getSignatureData(
          signFullOfferResult as ReturnTypeMcp,
        );
        if (signatureData.types && signatureData.types.EIP712Domain) {
          delete (signatureData.types as any).EIP712Domain; // we don't need to hash the domain
        }
        const signature = await sellerWallet._signTypedData(
          signatureData.domain,
          signatureData.types,
          signatureData.message,
        );
        const commitResult = await mcpClient.createOfferAndCommit({
          ...offerArgs,
          signature,
          signerAddress: buyerWallet.address,
        });
        resultIsSuccessful(commitResult, /The offer has been voided/);
      });
      test("void non listed offer batched", async () => {
        const fullOffers = (await Promise.all(
          [1, 2, 3].map(async (i) => {
            const { metadataUri, metadataHash } = await storeProductV1Metadata(
              mcpClient,
              {
                ...minimalOfferMetadata,
                name: `Offer to be voided ${i}`,
                description: `This offer will be voided ${i}`,
                configId: "local-31337-0",
                signerAddress: sellerWallet.address,
              },
            );
            return {
              ...fullOffer,
              metadataUri,
              metadataHash,
            } as Parameters<
              typeof mcpClient.voidNonListedOfferBatch
            >[0]["fullOffers"][number];
          }),
        )) as Parameters<
          typeof mcpClient.voidNonListedOfferBatch
        >[0]["fullOffers"];
        const voidResult = await mcpClient.voidNonListedOfferBatch({
          fullOffers,
          configId: "local-31337-0",
          signerAddress: sellerWallet.address,
        });
        resultIsSuccessful(voidResult, /"success": true/);
        let voidReceipt: any;
        await signAndSendTransactionData(
          voidResult,
          mcpClient,
          sellerWallet,
          (_receipt) => (voidReceipt = _receipt),
          "local-31337-0",
        );
        expect(voidReceipt).toBeTruthy();
        // Wait for subgraph to index
        const { blockNumber } = voidReceipt;
        await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
        for (const offerArgs of fullOffers) {
          const signFullOfferResult = await mcpClient.signFullOffer({
            ...offerArgs,
            offerCreator: sellerWallet.address,
            committer: buyerWallet.address,
            configId: "local-31337-0",
            signerAddress: sellerWallet.address,
          });
          resultIsSuccessful(signFullOfferResult, /"success": true/);
          const signatureData = getSignatureData(
            signFullOfferResult as ReturnTypeMcp,
          );
          if (signatureData.types && signatureData.types.EIP712Domain) {
            delete (signatureData.types as any).EIP712Domain; // we don't need to hash the domain
          }
          const signature = await sellerWallet._signTypedData(
            signatureData.domain,
            signatureData.types,
            signatureData.message,
          );
          const commitResult = await mcpClient.createOfferAndCommit({
            ...offerArgs,
            offerCreator: sellerWallet.address,
            committer: buyerWallet.address,
            signature,
            configId: "local-31337-0",
            signerAddress: buyerWallet.address,
          });
          resultIsSuccessful(commitResult, /The offer has been voided/);
        }
      });
    });
    describe("Buyer initiated offer", () => {
      let buyerId: string;
      let offerId: string;
      let exchangeId: string;
      let fullOffer: any;
      let buyerCoreSdk2: CoreSDK;
      let buyerWallet2: Wallet;
      beforeAll(async () => {
        // Create another buyer wallet
        ({ coreSDK: buyerCoreSdk2, fundedWallet: buyerWallet2 } =
          await initCoreSDKWithFundedWallet(TEST_KEY_BUYER));
        fullOffer = {
          ...fullOfferBase,
          quantityAvailable: 1,
          creator: "BUYER",
          offerCreator: buyerWallet2.address,
          committer: sellerWallet.address,
          sellerId: "0",
        };
      });
      test("create buyer and buyerId", async () => {
        const createBuyerResult = await mcpClient.createBuyer({
          configId: "local-31337-0",
          signerAddress: buyerWallet2.address,
        });

        resultIsSuccessful(createBuyerResult, /"success": true/);

        let createBuyerReceipt;
        await signAndSendTransactionData(
          createBuyerResult,
          mcpClient,
          buyerWallet2,
          (_receipt) => (createBuyerReceipt = _receipt),
          "local-31337-0",
        );

        const { logs } = createBuyerReceipt;
        buyerId =
          buyerCoreSdk2.getCreatedBuyerIdFromLogs(logs)?.toString() || "";
        expect(buyerId).toBeTruthy();

        // Wait for subgraph to index
        const { blockNumber } = createBuyerReceipt;
        await buyerCoreSdk2.waitForGraphNodeIndexing(blockNumber);
      });
      test("buyer deposits offer price", async () => {
        expect(buyerId).toBeTruthy();
        await ensureMintedAndAllowedTokens([buyerWallet2], fullOffer.price);

        const depositResult = await mcpClient.depositFunds({
          entityId: buyerId,
          amount: fullOffer.price,
          tokenAddress: fullOffer.exchangeToken || ethers.constants.AddressZero,
          configId: "local-31337-0",
          signerAddress: buyerWallet2.address,
        });
        resultIsSuccessful(depositResult, /"success": true/);
        let depositReceipt: any;
        await signAndSendTransactionData(
          depositResult,
          mcpClient,
          buyerWallet2,
          (_receipt) => (depositReceipt = _receipt),
          "local-31337-0",
        );
        expect(depositReceipt).toBeTruthy();
        expect(depositReceipt.hash).toBeTruthy();
      });
      test("create non listed offer and commit", async () => {
        expect(buyerId).toBeTruthy();
        const signFullOfferResult = await mcpClient.signFullOffer({
          ...fullOffer,
          buyerId,
          configId: "local-31337-0",
          signerAddress: buyerWallet2.address,
        });
        resultIsSuccessful(signFullOfferResult, /"success": true/);
        const signatureData = getSignatureData(
          signFullOfferResult as ReturnTypeMcp,
        );
        if (signatureData.types && signatureData.types.EIP712Domain) {
          delete (signatureData.types as any).EIP712Domain; // we don't need to hash the domain
        }
        const signature = await buyerWallet2._signTypedData(
          signatureData.domain,
          signatureData.types,
          signatureData.message,
        );
        const commitResult = await mcpClient.createOfferAndCommit({
          ...fullOffer,
          buyerId,
          signature,
          configId: "local-31337-0",
          signerAddress: sellerWallet.address,
        });
        resultIsSuccessful(commitResult, /"success": true/);

        let commitReceipt: any;
        await signAndSendTransactionData(
          commitResult,
          mcpClient,
          sellerWallet,
          (_receipt) => (commitReceipt = _receipt),
          "local-31337-0",
        );

        const { logs } = commitReceipt;
        exchangeId =
          sellerCoreSdk.getCommittedExchangeIdFromLogs(logs)?.toString() || "";
        expect(exchangeId).toBeTruthy();

        // Wait for subgraph to index
        const { blockNumber } = commitReceipt;
        await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
      });
    });
  });

  describe("Conditional Offer Journey", () => {
    let conditionalOfferId: string;
    let conditionalExchangeId: string;

    test("create conditional offer with token gating", async () => {
      // Use a very early timestamp to avoid any blockchain time issues
      const validFromTime = 1577836800000; // January 1, 2020 00:00:00 UTC
      const currentBlock = await provider.getBlock("latest");
      const blockTime = currentBlock.timestamp * 1000; // Convert to milliseconds

      const createConditionalOfferResult =
        await mcpClient.createOfferWithCondition({
          price: "5000000",
          sellerDeposit: "0",
          buyerCancellationPenalty: "250000",
          quantityAvailable: 5,
          validFromDateInMS: validFromTime,
          validUntilDateInMS: blockTime + LONG_OFFER_VALIDITY_WINDOW_MS,
          voucherRedeemableFromDateInMS: validFromTime,
          voucherRedeemableUntilDateInMS: 0,
          disputePeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
          voucherValidDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
          resolutionPeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
          condition: {
            method: EvaluationMethod.Threshold,
            tokenType: TokenType.FungibleToken,
            tokenAddress: MOCK_ERC20_ADDRESS,
            gatingType: GatingType.PerAddress,
            minTokenId: "0", // Fungible token cannot have token id range
            maxTokenId: "0",
            threshold: "1",
            maxCommits: "1",
          },
          metadataUri,
          metadataHash,
          configId: "local-31337-0",
          signerAddress: sellerWallet.address,
        });

      resultIsSuccessful(createConditionalOfferResult, /"success": true/);

      let createConditionalOfferReceipt: any;
      await signAndSendTransactionData(
        createConditionalOfferResult,
        mcpClient,
        sellerWallet,
        (_receipt) => (createConditionalOfferReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = createConditionalOfferReceipt;
      conditionalOfferId = sellerCoreSdk.getCreatedOfferIdFromLogs(logs)!;
      expect(conditionalOfferId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = createConditionalOfferReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);

      // Mine a few additional blocks to ensure blockchain time advances
      await provider.send("evm_mine", []);
      await provider.send("evm_mine", []);
      await provider.send("evm_mine", []);
    });

    test("buyer commits to conditional offer", async () => {
      expect(conditionalOfferId).toBeTruthy();
      await ensureMintedAndAllowedTokens([buyerWallet], "5");

      const commitResult = await mcpClient.commitToOffer({
        offerId: conditionalOfferId,
        buyer: buyerWallet.address,
        configId: "local-31337-0",
        signerAddress: buyerWallet.address,
      });

      resultIsSuccessful(commitResult, /"success": true/);

      let commitReceipt: any;
      await signAndSendTransactionData(
        commitResult,
        mcpClient,
        buyerWallet,
        (_receipt) => (commitReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = commitReceipt;
      conditionalExchangeId =
        sellerCoreSdk.getCommittedExchangeIdFromLogs(logs)?.toString() || "";
      expect(conditionalExchangeId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = commitReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
    });

    test("complete conditional offer purchase", async () => {
      expect(conditionalExchangeId).toBeTruthy();

      const redeemResult = await mcpClient.redeemVoucher({
        exchangeId: conditionalExchangeId,
        configId: "local-31337-0",
        signerAddress: buyerWallet.address,
      });

      resultIsSuccessful(redeemResult, /"success": true/);

      let redeemReceipt: any;
      await signAndSendTransactionData(
        redeemResult,
        mcpClient,
        buyerWallet,
        (_receipt) => (redeemReceipt = _receipt),
        "local-31337-0",
      );

      // Wait for subgraph to index
      const { blockNumber } = redeemReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);

      // Verify conditional exchange completion
      const exchange = await sellerCoreSdk.getExchangeById(
        conditionalExchangeId,
      );
      expect(exchange.state).toBe(subgraph.ExchangeState.REDEEMED);
      expect(exchange.offer.id).toBe(conditionalOfferId);
    });
  });

  describe("Voucher Cancellation Journey", () => {
    let cancellationOfferId: string;
    let cancellationExchangeId: string;

    test("create offer for cancellation scenario", async () => {
      // Use early timestamp to avoid blockchain time issues
      const validFromTime = 1577836800000; // January 1, 2020 00:00:00 UTC
      const currentBlock = await provider.getBlock("latest");
      const blockTime = currentBlock.timestamp * 1000;

      const createOfferResult = await mcpClient.createOffer({
        price: "5000000",
        sellerDeposit: "0",
        buyerCancellationPenalty: "250000",
        quantityAvailable: 3,
        validFromDateInMS: validFromTime,
        validUntilDateInMS: blockTime + 1000 * 60 * 60 * 24, // 1 day
        voucherRedeemableFromDateInMS: validFromTime,
        voucherRedeemableUntilDateInMS: 0,
        disputePeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        voucherValidDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        resolutionPeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        metadataUri,
        metadataHash,
        configId: "local-31337-0",
        signerAddress: sellerWallet.address,
      });

      resultIsSuccessful(createOfferResult, /"success": true/);

      let createOfferReceipt: any;
      await signAndSendTransactionData(
        createOfferResult,
        mcpClient,
        sellerWallet,
        (_receipt) => (createOfferReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = createOfferReceipt;
      cancellationOfferId = sellerCoreSdk.getCreatedOfferIdFromLogs(logs)!;
      expect(cancellationOfferId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = createOfferReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);
    });

    test("buyer commits and then cancels voucher", async () => {
      expect(cancellationOfferId).toBeTruthy();

      const commitResult = await mcpClient.commitToOffer({
        offerId: cancellationOfferId,
        buyer: buyerWallet.address,
        configId: "local-31337-0",
        signerAddress: buyerWallet.address,
      });

      resultIsSuccessful(commitResult, /"success": true/);

      let commitReceipt: any;
      await signAndSendTransactionData(
        commitResult,
        mcpClient,
        buyerWallet,
        (_receipt) => (commitReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = commitReceipt;
      cancellationExchangeId =
        sellerCoreSdk.getCommittedExchangeIdFromLogs(logs)?.toString() || "";
      expect(cancellationExchangeId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = commitReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);

      // Cancel the voucher
      const cancelResult = await mcpClient.cancelVoucher({
        exchangeId: cancellationExchangeId,
        configId: "local-31337-0",
        signerAddress: buyerWallet.address,
      });

      resultIsSuccessful(cancelResult, /"success": true/);

      let cancelReceipt: any;
      await signAndSendTransactionData(
        cancelResult,
        mcpClient,
        buyerWallet,
        (_receipt) => (cancelReceipt = _receipt),
        "local-31337-0",
      );

      // Wait for subgraph to index
      const { blockNumber: cancelBlockNumber } = cancelReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(cancelBlockNumber);

      // Verify voucher cancellation
      const exchange = await sellerCoreSdk.getExchangeById(
        cancellationExchangeId,
      );
      expect(exchange.state).toBe(subgraph.ExchangeState.CANCELLED);
    });
  });

  describe("Offer Voiding Journey", () => {
    let voidOfferId: string;

    test("create and void offer", async () => {
      // Use early timestamp to avoid blockchain time issues
      const validFromTime = 1577836800000; // January 1, 2020 00:00:00 UTC
      const currentBlock = await provider.getBlock("latest");
      const blockTime = currentBlock.timestamp * 1000;

      const createOfferResult = await mcpClient.createOffer({
        price: "5000000",
        sellerDeposit: "0",
        buyerCancellationPenalty: "250000",
        quantityAvailable: 5,
        validFromDateInMS: validFromTime,
        validUntilDateInMS: blockTime + 1000 * 60 * 60 * 24, // 1 day
        voucherRedeemableFromDateInMS: validFromTime,
        voucherRedeemableUntilDateInMS: 0,
        disputePeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        voucherValidDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        resolutionPeriodDurationInMS: 1000 * 60 * 60 * 24 * 7, // 7 day
        metadataUri,
        metadataHash,
        configId: "local-31337-0",
        signerAddress: sellerWallet.address,
      });

      resultIsSuccessful(createOfferResult, /"success": true/);

      let createOfferReceipt: any;
      await signAndSendTransactionData(
        createOfferResult,
        mcpClient,
        sellerWallet,
        (_receipt) => (createOfferReceipt = _receipt),
        "local-31337-0",
      );

      const { logs } = createOfferReceipt;
      voidOfferId = sellerCoreSdk.getCreatedOfferIdFromLogs(logs)!;
      expect(voidOfferId).toBeTruthy();

      // Wait for subgraph to index
      const { blockNumber } = createOfferReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(blockNumber);

      // Verify offer is valid initially
      const initialOffer = await sellerCoreSdk.getOfferById(voidOfferId);
      expect(initialOffer.voided).toBe(false);

      // Void the offer
      const voidResult = await mcpClient.voidOffer({
        offerId: voidOfferId,
        configId: "local-31337-0",
        signerAddress: sellerWallet.address,
      });

      resultIsSuccessful(voidResult, /"success": true/);

      let voidReceipt: any;
      await signAndSendTransactionData(
        voidResult,
        mcpClient,
        sellerWallet,
        (_receipt) => (voidReceipt = _receipt),
        "local-31337-0",
      );

      // Wait for subgraph to index
      const { blockNumber: voidBlockNumber } = voidReceipt;
      await sellerCoreSdk.waitForGraphNodeIndexing(voidBlockNumber);

      // Verify offer is voided
      const voidedOffer = await sellerCoreSdk.getOfferById(voidOfferId);
      expect(voidedOffer.voided).toBe(true);
    });
  });
});
