# Boson Protocol Agentic Commerce — AI Agent Guide

This file is the primary reference for AI agents working with this repository. It covers everything needed to perform end-to-end selling and buying on the [Boson Protocol](https://bosonprotocol.io).

Follows the [`AGENTS.md` convention](https://agents.md) used by Codex, Amp, Aider, Cursor, Jules, and others. Claude Code loads it via `CLAUDE.md` → `@AGENTS.md`. For Gemini CLI or GitHub Copilot, symlink or copy to `GEMINI.md` or `.github/copilot-instructions.md`.

**Canonical sources of truth** (consult these when this guide is silent or ambiguous):

| Need | Source |
|---|---|
| Protocol concepts, glossary, lifecycles | https://docs.bosonprotocol.io |
| Agent integration (MCP + GOAT SDK) | https://docs.bosonprotocol.io/using-the-protocol/agent-integration |
| Full list of MCP tools with every parameter | [src/boson/mcp-server/README.md](src/boson/mcp-server/README.md) |
| Runnable reference for every flow | [e2e/boson/tests/](e2e/boson/tests/complete-marketplace-journeys.test.ts) (especially `complete-marketplace-journeys.test.ts`) |
| SDK type definitions & state enums | `node_modules/@bosonprotocol/core-sdk/src/subgraph.ts` (ExchangeState, DisputeState) and `node_modules/@bosonprotocol/common/src/types/accounts.ts` (AuthTokenType) |
| Solidity ground truth (enums, structs) | [boson-protocol-contracts/contracts/domain/BosonTypes.sol](https://github.com/bosonprotocol/boson-protocol-contracts/blob/main/contracts/domain/BosonTypes.sol) |

---

## What This Repo Provides

This is the official MCP integration layer for the Boson Protocol — a Decentralized Agentic Commerce Protocol (dACP) for on-chain exchange of physical and digital goods.

| Component | Path | Purpose |
|---|---|---|
| Boson MCP Server | `src/boson/mcp-server/` | 54 tools + 2 prompts + 10 resources for all Boson operations |
| Boson MCP Client | `src/boson/mcp-client/` | Typed TypeScript client (camelCase methods mirroring server tools) |
| GOAT SDK Plugin | `src/boson/goat-sdk-plugin/` | Drop-in plugin for GOAT SDK / Vercel AI / Anthropic agents |
| High Value Asset Module MCP Server | `src/fermion/mcp-server/` | Tools for the High Value Asset Module (formerly Fermion Protocol, integrated into Boson in 2025 — adds verifier + custodian roles for high-value assets) |
| E2E tests | `e2e/boson/tests/` | Trustworthy reference for every end-to-end flow |

---

## Boson Protocol Core Concepts

**Offer** — A seller's on-chain listing: price, deposits, validity period, metadata, dispute resolver. May be publicly listed, *non-listed* (private, EIP-712 signed off-chain), *token-gated*, *price-discovery* (auction), or part of a *bundle*.

**Exchange** — A single sale's lifecycle: buyer commits → funds locked in escrow → voucher NFT minted → buyer redeems → dispute period → funds released.

**Voucher (rNFT)** — ERC-721 token issued to the buyer on commit. Transferable / tradeable on secondary markets. Redemption burns the NFT and triggers off-chain fulfillment. May be *preminted* by the seller to list on external marketplaces before any commit.

**Seller** — Protocol entity with three roles (Ethereum addresses):
- `admin` — governance; can re-assign roles; controls auth-token binding
- `assistant` — day-to-day ops (create/void offers, revoke vouchers, choose royalty recipients per offer)
- `treasury` — receives proceeds

At creation all three **must be the same address**; they can be re-assigned later. Re-assigning admin/assistant requires confirmation from the new address; treasury does not.

**Buyer** — Entity representing a purchaser. **Auto-created on first commit** in most cases; `create_buyer` is only needed up-front for buyer-initiated offers (so the buyer can `deposit_funds` first).

**Dispute Resolver (DR)** — Neutral third-party arbitrator. Has its own admin/assistant/treasury, sets its own fee token + amount, and may maintain an allow-list of sellers. Assigned per-offer via `disputeResolverId`.

**Agent** (protocol entity, not AI) — A marketplace / surfacing platform that earns a fee percentage per offer. **Do not confuse with "AI agent".**

**Royalty Recipient** — First-class account type; admin maintains an allow-list, assistant wires one per offer.

**Bundle** — An item bundle (multiple ProductV1 and/or NFT components) listed as a single offer.

For the full glossary see https://docs.bosonprotocol.io/learn-about-boson-protocol/glossary.

---

## Quick Start: Hosted MCP Servers

Boson operates cloud-hosted MCP servers — no local setup required for the server itself:

| Environment | URL |
|---|---|
| Staging | `https://mcp-staging.bosonprotocol.io/mcp` |
| Production | `https://mcp.bosonprotocol.io/mcp` |

Add to your MCP client config:

```json
{
  "mcpServers": {
    "boson": {
      "url": "https://mcp-staging.bosonprotocol.io/mcp"
    }
  }
}
```

Write operations still require your own wallet and signing — the server never holds keys.

---

## Critical Concept: Transaction Signing Pattern

**Every state-changing tool returns an unsigned transaction. It does NOT execute automatically.**

The 3-step pattern for all write operations:

```
1. Call tool  →  returns { to, data, ... } (unsigned tx fields)
2. Sign       →  locally with your wallet (e.g. ethers `wallet.signTransaction(tx)`,
                 viem `walletClient.signTransaction(tx)`) — never send your private key
                 over the network
3. Broadcast  →  send_signed_transaction with the signed hex
```

Every write tool takes a `signerAddress` — it tells the protocol *which account* is performing the action (for authorization). It does **not** mean the server signs for you.

The MCP server never holds keys. All signing happens in your own infrastructure; the server only returns unsigned data and broadcasts pre-signed hex.

### executionMode

Most write tools accept an optional `executionMode`:

- `"direct"` (default) — standard on-chain tx; sign locally + `send_signed_transaction`
- `"metaTx"` — gasless relay via Biconomy; use `send_meta_transaction` / `send_native_meta_transaction` / `send_forwarded_meta_transaction` (ERC-20 gas payment). Typed data is returned for local EIP-712 signing; the relayer pays gas.

### Indexing latency

After any write, the Boson subgraph needs a few blocks to index. Reads (`get_offers`, `get_exchanges`, etc.) will lag the chain. If you must read state you just wrote, use `CoreSDK.waitForGraphNodeIndexing(blockNumber)` (see e2e tests) or poll with retries.

---

## ConfigId: Choosing Your Network

All tools require a `configId` parameter identifying the network + protocol version. Format: `{env}-{chainId}-{version}`.

| Environment | configId | Network |
|---|---|---|
| Local dev | `local-31337-0` | Hardhat local |
| Testnet | `testing-80002-0` | Polygon Amoy |
| Testnet | `testing-84532-0` | Base Sepolia |
| Testnet | `testing-11155111-0` | Ethereum Sepolia |
| Testnet | `testing-11155420-0` | Optimism Sepolia |
| Testnet | `testing-421614-0` | Arbitrum Sepolia |
| Staging | `staging-80002-0` | Polygon Amoy |
| Staging | `staging-84532-0` | Base Sepolia |
| Staging | `staging-11155111-0` | Ethereum Sepolia |
| Staging | `staging-11155420-0` | Optimism Sepolia |
| Staging | `staging-421614-0` | Arbitrum Sepolia |
| Production | `production-137-0` | Polygon |
| Production | `production-1-0` | Ethereum |
| Production | `production-8453-0` | Base |
| Production | `production-10-0` | Optimism |
| Production | `production-42161-0` | Arbitrum |

Call `get_config_ids` to see which configIds the running server actually supports (set via the `CONFIG_IDS` env var).

---

## Canonical Enum Values

**Pass these as numbers, not strings.**

### AuthTokenType (for seller admin binding)
From `@bosonprotocol/common` accounts.ts:

| Value | Meaning |
|---:|---|
| `0` | NONE — standard wallet admin (default) |
| `1` | CUSTOM — reserved |
| `2` | LENS — Lens Protocol profile NFT |
| `3` | ENS — ENS name |

When `authTokenType !== 0`, set `admin: "0x0000...0000"` and `authTokenId: <NFT tokenId>`.

### EvaluationMethod (token-gating `condition.method`)
From `@bosonprotocol/common` groups.ts:

| Value | Meaning |
|---:|---|
| `0` | None |
| `1` | Threshold — hold `≥ threshold` tokens |
| `2` | TokenRange — hold any token ID in `[minTokenId, maxTokenId]` |

> Note: `validation.ts` currently describes method `2` as "SpecificToken" — this is a stale string alias. The canonical SDK name is `TokenRange`.

### TokenType (`condition.tokenType`)

| Value | Meaning |
|---:|---|
| `0` | FungibleToken (ERC-20) |
| `1` | NonFungibleToken (ERC-721) |
| `2` | MultiToken (ERC-1155) |

### GatingType (`condition.gatingType`)

| Value | Meaning |
|---:|---|
| `0` | PerAddress — each qualifying wallet commits `maxCommits` times |
| `1` | PerTokenId — each qualifying token ID used `maxCommits` times |

### OfferCreator / `creator` (enum accepted by MCP as string)

`"SELLER"` (default, enum 0) or `"BUYER"` (enum 1). When `creator === "BUYER"`, `quantityAvailable` must be `1`.

### priceType (offer `priceType`)

`0` = static fixed price. `1` = price discovery (auction / order book / resolve-at-commit).

---

## Seller Flow: End-to-End

### Step 1 — Create Seller Account (if needed)

Check first — call `get_sellers_by_address` with `signerAddress`. If a seller exists, use its `id` as `sellerId` directly. The `create-seller-if-needed` MCP prompt automates this.

```
Tool: create_seller
Required: configId, signerAddress
Seller metadata (required by schema): type: "SELLER", kind: <string>, contactPreference: <string>
Optional metadata: name, description, legalTradingName, website, images[], contactLinks[], socialLinks[], salesChannels[]
Other params:
  contractUri: "" | ipfs://... (OpenSea-style storefront metadata)
  royaltyPercentage: "0"–"10000" (basis points; default for all offers)
  authTokenType: 0 (NONE) — pass a number, not a string
  authTokenId: "0"
```

Note: the `create_seller` tool automatically sets `admin`, `assistant`, and `treasury` to `signerAddress`. If you need distinct roles, use the plugin / client variant that accepts all three explicitly, or call `update_seller` afterwards.

→ Sign and broadcast. Extract `sellerId` from transaction logs via `CoreSDK.getCreatedSellerIdFromLogs(receipt.logs)`.

### Step 2 — Store Product Metadata on IPFS

Required before `create_offer`. Three variants:

```
store_product_v1_metadata  — standard physical/digital product
store_bundle_metadata      — bundle of multiple items (requires pre-stored items)
store_base_metadata        — minimal custom metadata
```

For bundles: first call `store_bundle_item_product_v1_metadata` and/or `store_bundle_item_nft_metadata` for each item, include their returned `url`s in the `items` array, then call `store_bundle_metadata`.

Optional: run `validate_metadata` first to catch schema errors without uploading.

→ Returns `{ metadataUri: "ipfs://...", metadataHash: "0x..." }`. Store both.

### Step 3 — (Optional) Choose a Dispute Resolver

Offers must reference a `disputeResolverId`. Call `get_dispute_resolvers` to list available resolvers (shows fees, response period, supported tokens). Required in most deployments; omit only if the protocol version does not require one.

### Step 4 — Create Offer

```
Tool: create_offer
Required: configId, signerAddress, metadataUri, metadataHash, and:
  price: "1000000000000000000"         # wei (smallest unit of exchange token)
  sellerDeposit: "0"                   # seller collateral; forfeited on revoke
  buyerCancellationPenalty: "0"        # deducted from buyer on cancel
  quantityAvailable: 10                # 1 if creator="BUYER"
  validFromDateInMS: Date.now()
  validUntilDateInMS: <future_ts>
  voucherRedeemableFromDateInMS: <ts>  # ≥ validFromDateInMS
  voucherRedeemableUntilDateInMS: 0    # 0 → use voucherValidDurationInMS
  voucherValidDurationInMS: 604800000
  disputePeriodDurationInMS: 604800000   # window to raise dispute post-redeem
  resolutionPeriodDurationInMS: 259200000 # window to resolve a raised dispute
  disputeResolverId: "<from step 3>"
Optional:
  exchangeTokenAddress: "0x..."        # ERC-20; omit / address(0) for native
  agentId: "0"                         # dACP protocol-agent id (not AI)
  priceType: 0                         # 0 = static, 1 = discovery
  feeLimit: "<max protocol fee seller accepts>"
  collectionIndex: "0"
  royaltyInfo: { recipients: ["0x..."], bps: ["500"] }   # sum ≤ 10000
  creator: "SELLER"                    # default; "BUYER" makes it an RFQ
  executionMode: "direct" | "metaTx"
```

→ Sign and broadcast. Extract `offerId` from logs.

For token-gated offers use `create_offer_with_condition` and add a `condition` object (see the `condition` schema under "Token-Gated Offers" below).

### Step 5 — Monitor Exchanges

```
Tool: get_exchanges
  exchangesFilter:
    sellerId: "<your sellerId>"
    state: "COMMITTED" | "REDEEMED" | "DISPUTED" | ...
```

After `REDEEMED`, start the dispute-period timer. After redemption + `disputePeriodDurationInMS` with no dispute, anyone can `complete_exchange`.

### Step 6 — Withdraw Proceeds

After exchanges complete:

```
Tool: withdraw_funds
  entityId: "<your sellerId>"
  tokenAddress: "0x0000000000000000000000000000000000000000"   # 0x0 for native
  amount: "<wei>"
```

Query balances with `get_funds`.

---

## Buyer Flow: End-to-End

### Step 1 — Browse Offers

```
get_offers                             # with filters (voided, sellerId, price, etc.)
get_all_products_with_not_voided_variants   # storefront-style grouping
```

### Step 2 — Approve Payment Token (ERC-20 only)

If the offer's `exchangeToken.address` ≠ zero address:

```
Tool: approve_exchange_token
  offerId: "<offerId>"
```

→ Sign and broadcast. Grants the protocol allowance to pull tokens on `commit_to_offer`.

### Step 3 — Commit to Offer

```
Tool: commit_to_offer
  offerId: "<offerId>"
  buyer: "<buyer address>"             # optional; defaults to signerAddress
```

→ Sign and broadcast. Funds locked in escrow, voucher NFT minted. Extract `exchangeId` from logs via `CoreSDK.getCommittedExchangeIdFromLogs(receipt.logs)`.

### Step 4 — Redeem Voucher

```
Tool: redeem_voucher
  exchangeId: "<exchangeId>"
```

→ Sign and broadcast. Voucher NFT burned. Dispute period clock starts. Seller is expected to deliver off-chain.

### Step 5 (optional) — Raise Dispute

Must be within `disputePeriodDurationInMS` of redemption:

```
Tool: raise_dispute
  exchangeId: "<exchangeId>"
```

Exchange state transitions to `DISPUTED`; initial dispute state is `RESOLVING`. See dispute section below.

### Step 6 — Complete Exchange

After redemption with no dispute (either anyone after dispute period, or buyer at any time):

```
Tool: complete_exchange
  exchangeId: "<exchangeId>"
```

Releases funds to the seller's treasury balance. Seller then `withdraw_funds`.

---

## Exchange & Dispute State Machines

**Exchange state and dispute state are distinct.** When a dispute is raised, the *exchange* state becomes `DISPUTED`, but the *dispute entity* has its own state starting at `RESOLVING`.

### ExchangeState (`@bosonprotocol/core-sdk/subgraph.ts`)

`COMMITTED`, `REDEEMED`, `COMPLETED`, `DISPUTED`, `CANCELLED`, `REVOKED`.

Plus one **client-side derived** state (not on-chain):
- `EXPIRED` — `COMMITTED` exchange whose `voucherRedeemableUntil` has passed without redemption; triggered via `cancel_voucher` by anyone (behaves like CANCELLED).

### DisputeState

`RESOLVING` (initial after `raise_dispute`), `RETRACTED`, `RESOLVED`, `ESCALATED`, `DECIDED`, `REFUSED`.

### Transition diagram

```
[Offer listed]
     │
     ▼ commit_to_offer
  COMMITTED ─── revoke_voucher ──► REVOKED         (seller revokes; buyer gets deposit back)
     │
     ├── cancel_voucher ─────────► CANCELLED       (buyer cancels or voucher expires; penalty forfeited)
     │
     ▼ redeem_voucher
  REDEEMED ─── complete_exchange ► COMPLETED       (success; seller paid)
     │
     └── raise_dispute                             (Exchange → DISPUTED, Dispute → RESOLVING)
           │
        DISPUTED/RESOLVING
           ├── retract_dispute ─► DISPUTED/RETRACTED  (buyer withdraws; flows to completion)
           ├── resolve_dispute ─► DISPUTED/RESOLVED   (mutual agreement, custom split)
           ├── expire_dispute ──► DISPUTED/RETRACTED  (resolution timeout)
           └── escalate_dispute (buyer pays escalation deposit)
                 │
              DISPUTED/ESCALATED
                 ├── resolve_dispute ──────────► DISPUTED/RESOLVED
                 ├── decide_dispute ───────────► DISPUTED/DECIDED  (DR rules; basis-points split)
                 ├── refuse_escalated_dispute ─► DISPUTED/RESOLVING (escalation fee refunded)
                 └── expire_escalated_dispute ─► DISPUTED/REFUSED   (DR didn't respond in time)
```

### State-transition reference

| Action | Exchange before → after | Dispute before → after | Caller |
|---|---|---|---|
| `commit_to_offer` | (listed) → COMMITTED | — | Buyer |
| `revoke_voucher` | COMMITTED → REVOKED | — | Seller assistant |
| `cancel_voucher` | COMMITTED → CANCELLED | — | Buyer (or anyone if expired) |
| `redeem_voucher` | COMMITTED → REDEEMED | — | Buyer |
| `complete_exchange` | REDEEMED → COMPLETED | — | Anyone (after dispute period) |
| `raise_dispute` | REDEEMED → DISPUTED | — → RESOLVING | Buyer (within disputePeriod) |
| `retract_dispute` | DISPUTED | RESOLVING/ESCALATED → RETRACTED | Buyer |
| `resolve_dispute` | DISPUTED | RESOLVING/ESCALATED → RESOLVED | Either (both signed) |
| `extend_dispute_timeout` | DISPUTED | RESOLVING | Either |
| `expire_dispute` | DISPUTED | RESOLVING → RETRACTED | Anyone (post-timeout) |
| `escalate_dispute` | DISPUTED | RESOLVING → ESCALATED | Buyer (pays escalation deposit) |
| `decide_dispute` | DISPUTED | ESCALATED → DECIDED | Dispute Resolver |
| `refuse_escalated_dispute` | DISPUTED | ESCALATED → RESOLVING | Dispute Resolver |
| `expire_escalated_dispute` | DISPUTED | ESCALATED → REFUSED | Anyone (post-response-period) |

Docs: https://docs.bosonprotocol.io/using-the-protocol/dacp-tools/exchange-mechanism

### Payout outcomes

| Final state | Seller receives | Buyer receives |
|---|---|---|
| COMPLETED / RETRACTED | Price − protocol fee − agent fee + seller deposit | — |
| CANCELLED / EXPIRED | Cancellation penalty | Price − penalty |
| REVOKED | — | Price + seller deposit |
| RESOLVED | Per signed agreement (basis points) | Per signed agreement |
| DECIDED | Per DR ruling (basis points) | Per DR ruling |
| REFUSED | Seller deposit back | Price + escalation deposit |

Protocol fee is zero when the exchange token is `$BOSON`. Agent fee is set per-offer via `agentId`.

Fees reference: https://docs.bosonprotocol.io/learn-about-boson-protocol/core-concepts/fees

---

## Non-Listed (Private / Bilateral) Offers

For peer-to-peer deals not publicly listed on-chain. Uses EIP-712 signatures. Contract-wallet signers are supported via EIP-1271.

**Seller-initiated private offer:**
1. Seller calls `sign_full_offer` → returns EIP-712 typed data
2. Seller signs the typed data locally with their wallet (EIP-712)
3. Seller shares the `signature` with the buyer (off-chain)
4. Buyer calls `create_offer_and_commit` with the signature → atomic create + commit

**Buyer-initiated private offer:**
1. Buyer calls `create_buyer` to get a `buyerId`
2. Buyer calls `deposit_funds` to pre-fund the price
3. Buyer calls `sign_full_offer` with `creator: "BUYER"` → EIP-712 typed data
4. Buyer signs and shares signature + offer details with seller
5. Seller calls `create_offer_and_commit` → atomic create + commit

**Cancel before fulfillment:**
- `void_non_listed_offer` — cancel one private offer (same params as `sign_full_offer`)
- `void_non_listed_offer_batch` — batch cancel

---

## Token-Gated Offers

```
Tool: create_offer_with_condition
(same params as create_offer, plus:)
  condition:
    method: 1         # 0=None, 1=Threshold, 2=TokenRange
    tokenType: 1      # 0=ERC-20, 1=ERC-721, 2=ERC-1155
    tokenAddress: "0x..."
    gatingType: 0     # 0=PerAddress, 1=PerTokenId
    minTokenId: "0"
    maxTokenId: "0"
    threshold: "1"    # min token balance
    maxCommits: "1"   # max commits per qualifying address or token ID
```

Conditions also support ERC-20, ERC-721, and ERC-1155 holders; multiple offers can share a condition via a group (see docs).

---

## Dispute Resolution (Mutual Agreement)

```
1. Both parties negotiate the split off-chain.
2. create_dispute_resolution_proposal → EIP-712 typed data (buyerPercentBasisPoints 0–10000).
3. Both parties sign the typed data locally with their wallet (EIP-712).
4. Either party submits resolve_dispute with both signatures' sigR/sigS/sigV.
   → Dispute state: RESOLVED; funds split per agreement.
```

EIP-1271 contract-wallet signatures are accepted.

---

## Buyer-Initiated (RFQ) Offers

A buyer can publish an offer (request for quote):

```
create_offer  with creator: "BUYER", quantityAvailable: 1
```

Then the seller accepts:

```
commit_to_buyer_offer
  offerId: "<offerId>"
```

This is distinct from the non-listed/private flow above (which is bilateral & off-chain-first).

---

## Tool Inventory (54 tools)

Full documentation with every parameter lives in [src/boson/mcp-server/README.md](src/boson/mcp-server/README.md). This is an orientation map — call that file when you need exact signatures.

**Configuration & discovery:** `get_config_ids`, `get_supported_tokens`, `get_dispute_resolvers`, `get_registered_agents`.

**Read-only queries (also available as MCP resources):** `get_offers`, `get_exchanges`, `get_sellers`, `get_sellers_by_address`, `get_disputes`, `get_dispute_by_id`, `get_funds`, `get_all_products_with_not_voided_variants`.

**Seller / buyer accounts:** `create_seller`, `update_seller`, `create_buyer`.

**Metadata (IPFS):** `validate_metadata`, `store_product_v1_metadata`, `store_bundle_metadata`, `store_base_metadata`, `store_bundle_item_product_v1_metadata`, `store_bundle_item_nft_metadata`, `render_contractual_agreement`.

**Offer lifecycle:** `create_offer`, `create_offer_with_condition`, `sign_full_offer`, `create_offer_and_commit`, `void_offer`, `void_non_listed_offer`, `void_non_listed_offer_batch`.

**Exchange lifecycle:** `approve_exchange_token`, `commit_to_offer`, `commit_to_buyer_offer`, `redeem_voucher`, `cancel_voucher`, `revoke_voucher`, `complete_exchange`.

**Disputes:** `raise_dispute`, `retract_dispute`, `create_dispute_resolution_proposal`, `resolve_dispute`, `extend_dispute_timeout`, `expire_dispute`, `expire_dispute_batch`, `escalate_dispute`, `decide_dispute`, `refuse_escalated_dispute`, `expire_escalated_dispute`.

**Funds:** `deposit_funds`, `withdraw_funds`.

**Transaction sending:** `send_signed_transaction`, `send_meta_transaction`, `send_native_meta_transaction`, `send_forwarded_meta_transaction`. (Signing is done locally with your wallet; the server never receives private keys.)

**Agent registry:** `register_agent`, `get_registered_agents`.

### MCP prompts

- `create-seller-if-needed` — checks for existing seller; creates if absent; returns `sellerId`. Args: `configId`, `signerAddress`.
- `create-offer` — guided metadata + offer creation. Args: `configId`, `signerAddress`.

### MCP resources

Same data as the `get_*` tools but accessed via URI templates: `config-ids://ids`, `offers://entities`, `products://entities`, `exchanges://entities`, `disputes://entities`, `funds://entities`, `sellers://entities`, `sellers-by-address://entities`, `dispute-resolvers://entities`, `registered-agents://`.

Default to the `get_*` tools when in doubt — they are equivalent and mirror exact argument schemas.

---

## Agent Registry (dACP)

Register your agent in the dACP registry to make it discoverable:

```
register_agent
```

Requires `GITHUB_PERSONAL_ACCESS_TOKEN`; opens a PR against `AGENT_REGISTRY_REPO` (default `bosonprotocol/dACP-agents-registry`).

Registry JSON schema: https://github.com/bosonprotocol/dACP-agents-registry/blob/main/schemas/v1.0.0.json

Required top-level fields: `uuid`, `name`, `description`, `schemaVersion: "1.0.0"`, `entities[]` (each with `configId`, `role: seller|buyer|disputeResolver|marketplace|royaltyRecipient|other`, `entityId`, `signerAddress`).

List everything registered:

```
get_registered_agents
```

---

## Configuration

### Environment Variables

```bash
# Required for metadata storage (IPFS)
INFURA_IPFS_PROJECT_ID=<id>
INFURA_IPFS_PROJECT_SECRET=<secret>

# Networks this server supports (comma-separated configIds)
CONFIG_IDS=local-31337-0,testing-80002-0,production-137-0

# Required for agent registry tool
GITHUB_PERSONAL_ACCESS_TOKEN=<pat>
AGENT_REGISTRY_REPO=bosonprotocol/dACP-agents-registry
AGENT_REGISTRY_DIRECTORY=agents/local   # or agents/testing, agents/staging, agents/production

# Optional overrides
SUBGRAPH_URL=<override>
IPFS_METADATA_URL=<override>
THE_GRAPH_IPFS_URL=<override>
META_TX_RELAYER_URL=<biconomy endpoint>
API_KEY=<biconomy>
API_KEYS=<biconomy>
API_IDS={"0xContract":"apiId",...}
LOCALHOST_SUBSTITUTE=<host for Docker>

# HTTP server
BIND_ADDRESS=127.0.0.1              # 0.0.0.0 for Docker
ALLOWED_HOSTS=127.0.0.1,localhost
PORT=3000
```

### Running Locally

```bash
pnpm i --frozen-lockfile
pnpm build

# HTTP mode (recommended — works with MCP Inspector)
pnpm start:boson:http
pnpm dev:boson:http                 # watch mode

# Stdio mode (direct MCP client integration)
pnpm start:boson
```

### E2E tests

```bash
pnpm e2e:boson:services             # starts docker-compose (hardhat, subgraph, IPFS, MCP server)
pnpm e2e:boson:test                 # runs the full suite
```

Read [e2e/boson/tests/complete-marketplace-journeys.test.ts](e2e/boson/tests/complete-marketplace-journeys.test.ts) for a concrete reference implementation of every flow.

---

## Integration Options

### Option 1: Hosted MCP Server (zero setup)

Point your MCP client at a hosted endpoint. Write operations still require your wallet & signing.

### Option 2: GOAT SDK Plugin (for agent frameworks)

```typescript
import { bosonProtocolPlugin } from "@bosonprotocol/agentic-commerce";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";

const tools = await getOnChainTools({
  wallet: viem(walletClient),
  plugins: [
    bosonProtocolPlugin({
      url: "https://mcp-staging.bosonprotocol.io/mcp",
    }),
  ],
});
```

Working end-to-end examples:
- [src/boson/goat-sdk-plugin/examples/anthropic.ts](src/boson/goat-sdk-plugin/examples/anthropic.ts)
- [src/boson/goat-sdk-plugin/examples/vercel.ts](src/boson/goat-sdk-plugin/examples/vercel.ts)

### Option 3: Direct MCP Client

```typescript
import { BosonMCPClient } from "@bosonprotocol/agentic-commerce";

const client = new BosonMCPClient();
await client.connectToServer("https://mcp-staging.bosonprotocol.io/mcp");

// Every server tool → camelCase method
const offers = await client.getOffers({ configId: "production-137-0" });
const seller = await client.createSeller({ ...params });
// Every server resource → readX method
const funds = await client.readFunds({ configId: "production-137-0" });
```

The client helpers `signAndSendTransactionData` and `relayMetaTransaction` (see e2e `test-utils.ts`) encapsulate the 3-step sign+send pattern for direct and meta-tx modes.

### Option 4: Self-Hosted MCP Server

Copy `.env.example` to `.env`, fill values, build, run. See [src/boson/mcp-server/README.md](src/boson/mcp-server/README.md).

---

## High Value Asset Module (formerly Fermion Protocol)

"Fermion" is no longer used as a brand. The former Fermion Protocol was integrated into the Boson codebase in 2025 and is now the **High Value Asset Module** of Boson Protocol. Directory names (`src/fermion/`, `docs/fermion/`, `e2e/fermion/`), SDK package imports (`@fermionprotocol/core-sdk`, `@fermionprotocol/common`, `@fermionprotocol/metadata`), Docker image names, and script aliases (`start:fermion`, `dev:fermion`, etc.) are retained at the code level for compatibility.

The module is a marketplace built atop Boson's primitives, adding verifier + custodian roles for high-value / luxury assets (fNFTs). See:

- [src/fermion/README.md](src/fermion/README.md) — tool list & setup
- [docs/fermion/interact-with-fermion-protocol.md](docs/fermion/interact-with-fermion-protocol.md) — agent flow walkthrough
- [docs/fermion/setup-local-env.md](docs/fermion/setup-local-env.md) — local dev
- https://docs.fermionprotocol.io — legacy protocol docs (pre-integration)

Key module-only tools: `create_offer` (requires `verifierId`, `custodianId`, `facilitatorId`), `mint_wrap_nfts`, `mint_wrap_fixed_priced`, `create_fixed_price_order`, `cancel_fixed_price_orders`, `generate_asset_verification_email`, `generate_asset_custody_email`, `check_in`, `check_out`, `request_check_out`, `top_up_custodian_vault`, `submit_tax`. Use the same sign → `send_signed_transaction` pattern as Boson.

---

## Available Claude Code Skills

Skills in `.claude/skills/`:

- `boson-commerce:summary` — read-only status snapshot (active offers, exchanges by state).
- `boson-commerce:boson-commerce` — human-facing orchestrator for buying and selling.
- `boson-commerce:autonomous-seller-agent` — fully autonomous seller agent (A2A commerce).
- `boson-commerce:autonomous-buyer-agent` — fully autonomous buyer agent (A2A commerce).
- `anthropic-skills:buyer-agent` — human-assisted buyer flow orchestration (phases B–G).

---

## External Resources

| Resource | URL |
|---|---|
| Boson Protocol Docs | https://docs.bosonprotocol.io |
| Agent Integration (MCP + GOAT) | https://docs.bosonprotocol.io/using-the-protocol/agent-integration |
| dACP Tools index | https://docs.bosonprotocol.io/using-the-protocol/dacp-tools |
| Exchange Mechanism (lifecycle) | https://docs.bosonprotocol.io/using-the-protocol/dacp-tools/exchange-mechanism |
| Glossary | https://docs.bosonprotocol.io/learn-about-boson-protocol/glossary |
| Fees | https://docs.bosonprotocol.io/learn-about-boson-protocol/core-concepts/fees |
| Boson Protocol Website | https://www.bosonprotocol.io/ |
| Agent Commerce landing | https://www.bosonprotocol.io/agent-commerce-tech/ |
| agent-builder (LangChain, Telegram, XMTP) | https://github.com/bosonprotocol/agent-builder |
| direct-source-agent (Claude Code template) | https://github.com/bosonprotocol/direct-source-agent |
| dACP Agents Registry | https://github.com/bosonprotocol/dACP-agents-registry |
| Registry JSON schema | https://github.com/bosonprotocol/dACP-agents-registry/blob/main/schemas/v1.0.0.json |
| Boson Smart Contracts | https://github.com/bosonprotocol/boson-protocol-contracts |
| Contract ground-truth enums | https://github.com/bosonprotocol/boson-protocol-contracts/blob/main/contracts/domain/BosonTypes.sol |
| Boson Core Components SDK | https://github.com/bosonprotocol/core-components |
| Fermion Protocol (legacy; now Boson's High Value Asset Module since 2025) | https://fermionprotocol.io |
| Fermion Protocol Docs (legacy) | https://docs.fermionprotocol.io |
