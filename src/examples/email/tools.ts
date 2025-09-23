import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CoreTool } from "ai";
import zod from "zod";

const key = process.env["SMITHERY_GMAIL_KEY"];
if (!key) {
  throw new Error("SMITHERY_GMAIL_KEY must be defined in .env");
}

const sendEmailSchema = zod.object({
  to: zod.array(zod.string()).min(1),
  subject: zod.string(),
  body: zod.string(),
  cc: zod.array(zod.string()),
  bcc: zod.array(zod.string()),
  mimeType: zod.string(),
});

async function callEmailStdioMcpServer(
  toolName: string,
  parameters: { [x: string]: unknown },
) {
  const mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  // TODO: follow xmtp example and connect only once
  await mcp.connect(
    new StdioClientTransport({
      command: "npx",
      args: [
        "-y",
        "@smithery/cli@latest",
        "run",
        "@gongrzhe/server-gmail-autoauth-mcp",
        "--key",
        key,
      ],
    }),
  );
  return await mcp.callTool({
    name: toolName,
    arguments: parameters,
  });
}

export const sendEmailTool: CoreTool = {
  type: "function",
  parameters: sendEmailSchema,
  execute: async (params: zod.infer<typeof sendEmailSchema>) => {
    return await callEmailStdioMcpServer("send_email", params);
  },
};
