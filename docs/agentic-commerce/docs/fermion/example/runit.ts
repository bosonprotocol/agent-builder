import { program } from "commander";
import { createMcpClient } from "./create-mcp-client";
import { createSellerEntity } from "./seller-entity-creation";
import { createOffer } from "./create-offer";

program
  .name("runit")
  .description("Sign a transaction using a private key")
  .command("createMcpClient")
  .action(async () => { await createMcpClient() });

program
  .name("runit")
  .description("Sign a transaction using a private key")
  .command("createSellerEntity")
  .action(async () => createSellerEntity());

program
  .name("runit")
  .description("Sign a transaction using a private key")
  .command("createOffer")
  .action(async () => createOffer());

if (require.main === module) {
  program.parse();
}

