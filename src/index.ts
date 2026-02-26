#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "path";
import fs from "fs";
import { registerTools } from "./tools.js";

function resolveRootDir(): string {
  const arg = process.argv[2];

  if (arg) {
    const resolved = path.resolve(arg);
    if (!fs.existsSync(resolved)) {
      console.error(`Error: Path does not exist: ${resolved}`);
      process.exit(1);
    }
    return resolved;
  }

  return process.cwd();
}

async function main(): Promise<void> {
  const rootDir = resolveRootDir();

  const server = new McpServer({
    name: "search-code-mcp",
    version: "1.1.0",
  });

  registerTools(server, rootDir);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[search-code-mcp] Running. Root: ${rootDir}`);
}

main().catch((err) => {
  console.error("[search-code-mcp] Fatal error:", err);
  process.exit(1);
});
