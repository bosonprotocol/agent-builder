## Standalone - vercel

### Run the script

```
npm run start
```

### Usage Example

#### Set the system context (optional)

By using the `/system:` prefix, you can define a system context that will be applied to every prompt afterwards.

This allows to define the context for the AI Agent, influencing its behavior and actions.

Enter the following prompt (all in one line):
```
/system:
# Introducing **Élan Verité**
A textile house where craftsmanship, sustainability, and timeless design converge to offer an alternative to fast fashion.

Image: https://ibb.co/Fk6gRGK2

---

### 🌿 Ethos of Élan Verité

In contrast to the rapid turnover of trends, Élan Verité embraces the principles of slow fashion. Each piece is thoughtfully designed and meticulously crafted, ensuring longevity and a deep connection between the wearer and the garment.([Italian Artisan][1])

---

### ✨ Craftsmanship & Heritage

Our textiles are the result of generations of artisanal expertise. By collaborating with skilled craftspeople, we honor traditional techniques and bring them into a contemporary context. This commitment to heritage ensures that every item is not only beautiful but also carries a story worth telling.

---

### 🌍 Sustainability & Transparency

Sustainability is at the core of Élan Verité. We prioritize eco-friendly materials and ethical production practices, ensuring that our impact on the environment is minimal. Transparency in our processes allows our customers to make informed choices, aligning their values with their wardrobe.([Teen Vogue][2], [realthread.com][3])

---

### 🧵 Timeless Design

Eschewing fleeting trends, our designs focus on timeless elegance and versatility. This approach not only reduces waste but also encourages a more meaningful relationship with clothing.

---

Élan Verité stands as a testament to what fashion can be when it values quality over quantity, tradition over trend, and integrity over immediacy.

---




Here are the **5 most on-trend clothing items** your alternative textile brand—prioritising craftsmanship, sustainability, and timeless design—might feature for **Next Fall 2025**, drawing from the latest fashion forecasts:

---

### 1. **Patchwork Jackets** (Heritage Meets Modern)

Patchwork jackets are emerging as a standout outerwear trend for Fall 2025, blending nostalgia and individuality with both colorful and minimalist interpretations. This aligns beautifully with slow-fashion values using repurposed fabrics and artisanal patchwork techniques.
Main image URL: https://i.ibb.co/whXHBsMW/ai-image.png

---

### 2. **Timeless Tailoring with Sculptural Silhouettes**

There’s a strong push toward elevated tailoring—emphasising blazers with structured shoulders, nipped waists, and wide-leg trousers inspired by '80s power dressing. Think houndstooth or tweed in luxe, slow-fashion fabrics that exude elegance and precision. ([Glamour UK][2], [Chic Style Collective][3])
Main image URL: https://i.ibb.co/4gmcY7MD/ai-image-1.png

---

### 3. **Luxurious Velvet in Deep Jewel Tones**

Velvet is having a major comeback this season, particularly in rich jewel-tone pieces—burgundy, forest green, navy—used in draped dresses or refined tailoring. Velvet’s tactile richness complements your brand’s focus on quality and timeless luxury. ([Who What Wear][4], [Chic Style Collective][3])

---

### 4. **Midi Skirts with Sophisticated Flair**

Midi skirts—soft pleated or A-line—are shaping up to be this fall’s go-to. They embody a refined, versatile aesthetic that your brand can craft from high-quality, sustainable fabrics for enduring appeal. ([Vogue Scandinavia][5])

---

### 5. **Cowl-Neck Draped Silhouettes in Silk or Knits**

Cowl-neck tops or dresses in drapey, luxe fabrics like silk or fine knits offer understated elegance and fluidity—perfect for layering and sacrificing none of the wearability. These modern classics align with your brand’s ethos of lasting design. ([Tellar][6])

---

### Summary: Fall 2025 Must-Have Items for Élan Verité

| Item                        | Why It Fits the Brand                                                             |
| --------------------------- | --------------------------------------------------------------------------------- |
| **Patchwork Jackets**       | Celebrate heritage craftsmanship and sustainability through artisanal repurposing |
| **Sculptural Tailoring**    | Elevates utilitarian pieces into enduring wardrobe staples                        |
| **Jewel-Toned Velvet**      | Luxurious textures that transcend seasons and trends                              |
| **Elegant Midi Skirts**     | Versatile, timeless silhouettes with refined movement                             |
| **Cowl-Neck Draped Pieces** | Comfortable, elegant, and built for longevity                                     |

---
```

### Create a seller on Boson Protocol

Assuming:
- the context has been set as exposed previously,

the following prompt will run the AI Agent to create a seller for the Agent wallet if there is no seller created yet.

Blockchain used: Base Sepolia (defined by configId "staging-84532-0")

When successful, the create seller can be explored in the Boson dApp: https://interface-staging.on-fleek.app/#/sellers?configId=staging-84532-0&page=0&sortBy=validFromDate%3Adesc

Enter the following prompt (all in one line):
```
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

- First, check if the seller already exists on Boson Protocol for the configId "staging-84532-0" and for the current wallet.
- If it exists, return the sellerId as a number.
- If it does not exist, interact with Boson Protocol, as described in the INTERACTION WITH BOSON PROTOCOL paragraph, to get the seller created. Use the wallet address as signerAddress, generate a relevant name and description for the seller, sets the admin, assistant, and treasury to the wallet address, sets the contractUri to an empty string, sets the type to "SELLER", sets the kind to "individual".
- When the seller has been created, return the seller id of the created seller.
- If any error happens, return the error message.
```

### Create an offer on Boson Protocol

Assuming:
- the AI Agent has created a seller with their wallet,
- the context has been set as exposed previously,

the following prompt will run the AI Agent to create an offer for the product "*Patchwork Jackets*" defined in the context

Blockchain used: Base Sepolia (defined by configId "staging-84532-0")

When successful, the create offer can be explored in the Boson dApp: https://interface-staging.on-fleek.app/#/products?configId=staging-84532-0&page=0&sortBy=validFromDate%3Adesc

```
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

- First, find the seller on Boson Protocol for the configId "staging-84532-0" and for the current wallet.
- Then, Interact with Boson Protocol, as described in the INTERACTION WITH BOSON PROTOCOL paragraph, to create an offer on boson protocol for the item Patchwork Jackets. The exchange token is "USDC" and must be explicitely specified with the exchangeTokenAddress parameter, the price is "123.40 USDC". The details_offerCategory shall be PHYSICAL. The shipping.returnPeriod shall be 7 days. The offer should be valid until December 31th 2027. The voucher must be valid for 3 month from the date they have been bought.The voucher Redeemable until Date should be set to 0. Generate unique identifiers (uuid like this: 123e4567-e89b-12d3-a456-426655440000) for uuid and productUUID. Use the wallet address as signerAddress and configId = "staging-84532-0"
- When the offer has been created, return the offer id and product UUID.
- If any error happens, return the error message.

```
