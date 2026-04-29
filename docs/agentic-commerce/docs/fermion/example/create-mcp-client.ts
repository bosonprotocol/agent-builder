/**
 * Create an mcp-client and connect it to the mcp-server running in the Local Environment
 * 
 * This script can be run using ts-node: 
 * > npx ts-node runit.ts -- createMcpClient
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const mcpServerUrl = "http://localhost:3000/mcp";

export async function createMcpClient(listTools = true) {
  const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl));
  const client = new Client(
    {
      name: "fermion-mcp-client",
      version: "1.0.0"
    }
  );
  await client.connect(transport);

  if (listTools) {
    // List tools
    const { tools } = await client.listTools();
    console.log(tools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: JSON.stringify(tool.inputSchema),
      };
    }));
  }
  return client;
}
