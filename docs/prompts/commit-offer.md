# Commit Offer

## GENERAL CONTEXT

### INTERACTION WITH BOSON PROTOCOL

Boson Protocol is the Decentralized Commerce Protocol lying on EVM blockchain, like Ethereum, Polygon, Base, Optimism, Arbitrum and their respective testnets.
Interacting with Boson Protocol allows to:
- create entities (seller, buyer, dispute resolver) for the current user, identified with their wallet
- create offers for seller or buyer
- commit to an offer
- redeem an exchange
- raise a dispute
- etc.

To interact with Boson Protocol, the flow requires 3 steps:
- call the specific tool depending on the requested action (for instance commit-offer),
  this tool will return the transaction data, including 2 fields "to" and "data".
- sign the transaction data ("to" and "data") with the current wallet.
- send the signed transaction to the network.

When the transaction has been approved, the protocol data requires a few seconds to be updated

## ACTIONS

- For every tool, as config ID, use the config for Base Sepolia network and the wallet address as signerAddress.
- Find the offer on Boson Protocol using the user's provided offer id. If it's not an offer id, then find if it's a bundle or a productV1 and try to find which offer id the user wants, if there is more than 1 available then ask the user.
- Then, Interact with Boson Protocol, as described in the INTERACTION WITH BOSON PROTOCOL paragraph, to commit to an offer (you need the id and the buyer's wallet address which you must assume it's the current wallet) on Boson Protocol. An offer can be part of a productV1 or bundle and the user may give you their id instead, if it's part of a productV1 and it has more than 1 variations (variation=offer), then the user should give you which offer id they want to commit to. Committting should work unless:
     * - The exchanges region of protocol is paused
     * - The buyers region of protocol is paused
     * - OfferId is invalid
     * - Offer price type is not static
     * - Offer has been voided
     * - Offer has expired
     * - Offer is not yet available for commits
     * - Offer's quantity available is zero
     * - Buyer address is zero
     * - Buyer account is inactive
     * - Offer price is in native token and caller does not send enough
     * - Offer price is in some ERC20 token and caller also sends native currency
     * - Contract at token address does not support ERC20 function transferFrom
     * - Calling transferFrom on token fails for some reason (e.g. protocol is not approved to transfer)
     * - Received ERC20 token amount differs from the expected value
     * - Seller has less funds available than sellerDeposit
     * - Offer belongs to a group with a condition
- When the offer has been committed, return the new exchange id.
- If any error happens, return the error message.
