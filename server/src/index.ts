#!/usr/bin/env node

/**
 * Ciello MCP Server - Entry Point
 * 
 * Supports both stdio and HTTP transports:
 * - stdio: Default, for MCP clients that use stdio
 * - HTTP: Use --http flag, exposes /mcp endpoint for ChatGPT
 */

import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { startHttpServer } from "./transports/http.js";

const DEFAULT_PORT = 3001;

async function main() {
  const args = process.argv.slice(2);
  const useHttp = args.includes("--http") || args.includes("-h");
  const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

  const server = createServer();

  if (useHttp) {
    // HTTP mode for ChatGPT integration
    console.log("[Ciello] Starting in HTTP mode...");
    startHttpServer({ port, server });
  } else {
    // stdio mode (default for MCP clients)
    console.error("[Ciello] Starting in stdio mode...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[Ciello] Server connected via stdio");
  }
}

main().catch((error) => {
  console.error("[Ciello] Fatal error:", error);
  process.exit(1);
});
