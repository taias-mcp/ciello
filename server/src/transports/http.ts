/**
 * HTTP Transport for Ciello MCP Server
 * 
 * Uses StreamableHTTPServerTransport at /mcp endpoint for ChatGPT integration.
 * Fully stateless - no session tracking needed.
 */

import { createServer as createHttpServer, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface HttpServerOptions {
  port: number;
  server: Server;
}

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

export function startHttpServer(options: HttpServerOptions) {
  const { port, server: mcpServer } = options;

  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);

    // CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      });
      res.end();
      return;
    }

    // Health check endpoint
    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, {
        status: "healthy",
        server: "ciello",
        version: "1.0.0",
      });
      return;
    }

    // MCP endpoint - StreamableHTTP transport
    if (req.method === "POST" && url.pathname === "/mcp") {
      try {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Stateless mode
        });
        
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error("[HTTP] MCP request error:", error);
        sendJson(res, 500, { error: "Internal server error" });
      }
      return;
    }

    // 404 for unknown routes
    sendJson(res, 404, { error: "Not found" });
  });

  httpServer.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    Ciello MCP Server                      ║
╠═══════════════════════════════════════════════════════════╣
║  HTTP Transport Active (ChatGPT Compatible)               ║
║                                                           ║
║  5 Onboarding Tools:                                      ║
║    - start_onboarding                                     ║
║    - setup_board                                          ║
║    - create_first_task                                    ║
║    - expand_board                                         ║
║    - finish_setup                                         ║
║                                                           ║
║  Endpoints:                                               ║
║    GET  /health  - Health check                           ║
║    POST /mcp     - MCP protocol endpoint                  ║
║                                                           ║
║  Server running on http://localhost:${port}                 ║
║                                                           ║
║  To connect to ChatGPT:                                   ║
║    1. Start ngrok: ngrok http ${port}                       ║
║    2. Create app in ChatGPT with URL:                     ║
║       https://your-id.ngrok-free.app/mcp                  ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });

  return httpServer;
}
