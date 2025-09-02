# Create an Offer

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
- call the specific tool depending on the requested action (for instance create-seller),
  this tool will return the transaction data, including 2 fields "to" and "data".
- sign the transaction data ("to" and "data") with the current wallet.
- send the signed transaction to the network.

When the transaction has been approved, the protocol data requires a few seconds to be updated

## ACTIONS

- First, find the seller on Boson Protocol for the configId XXXXXXXXX and for the current wallet.
- Then, Interact with Boson Protocol, as described in the INTERACTION WITH BOSON PROTOCOL paragraph, to create an offer on Boson Protocol for the item XXXXXXXXXX. The exchange token has XXXX symbol, the price is XXXXX (in human-readable decimal). The details_offerCategory shall be PHYSICAL. The shipping.returnPeriod shall be 7 days (written like "7"). The offer should be valid until December 31st 2027 (use timestamp in string format). The voucher must be valid for 3 months from the date they have been bought. The voucher Redeemable until Date should be set to 0. Generate unique random identifiers (uuid like this: 123e4567-e89b-12d3-a456-426655440000) for uuid and productUUID.
- When the offer has been created, return the offer id and product UUID.
- If any error happens, return the error message.
