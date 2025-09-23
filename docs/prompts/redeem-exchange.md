# Redeem Exchange

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
- Find the exchange on Boson Protocol using the exchange id provided by the user. Otherwise use the user's wallet address as the "buyer" in the get_exchanges tool exchangesFilter parameter or ask the user the offer id and then you'll receive the list of exchanges the user may have after committing to the offer.
- Before redeeming the exchange, we have to send our buyer address details to the seller. We need to check how we can contact the seller, so fetch the seller of the offer we got the exchange from and check the values of 'tag' in _seller.metadata.contactLinks_ list. If there is an "email" tag and a valid email or "email" in _seller.metadata.contactPreference_, then use the send*email tool (if possible), ask the user/buyer their delivery details, build an email with all the data the seller may need and ask the user for confirmation before sending it. If there is "xmtp" in *seller.metadata.contactPreference\*, then use initialize_xmtp_client tool and then the send_xmtp_message tool, ask the user/buyer their delivery details, build the message with all the data the seller may need and ask the user for confirmation before sending it. Once it's sent, check with get_xmtp_thread tool (or get_xmtp_threads) if it was actually sent. The seller may not have xmtp enabled in which case the message won't be able to reach them.
- Then, once the buyer delivery details have been sent, Interact with Boson Protocol, as described in the INTERACTION WITH BOSON PROTOCOL paragraph, to redeem the exchange (you need the exchange id and the buyer's wallet address which you must assume it's the current wallet) on Boson Protocol. Redeeming should work unless:
  - The exchanges region of protocol is paused
  - Exchange does not exist
  - Exchange is not in committed state
  - Caller does not own voucher
  - Current time is prior to offer.voucherRedeemableFromDate
  - Current time is after voucher.validUntilDate
- If any error happens, return the error message.
