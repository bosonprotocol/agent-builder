# Create Seller If Needed

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

- First, check if the seller already exists on Boson Protocol for the configId passed as a parameter and for the current wallet.
- If it exists, return the sellerId as a number.
- If it does not exist, interact with Boson Protocol, as described in the INTERACTION WITH BOSON PROTOCOL paragraph, to get the seller created. Use the wallet address as signerAddress, generate a relevant name and description for the seller, sets the admin, assistant, and treasury to the wallet address, sets the contractUri to an empty string, sets the type to "SELLER", sets the kind to "individual".
- When the seller has been created, return the seller id of the created seller.
- If any error happens, return the error message.

