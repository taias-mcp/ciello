/**
 * Ciello MCP Server with ChatGPT Widget Integration
 * 
 * 5 stateless tools for the team task board onboarding demo.
 * Widgets are served as resources with text/html+skybridge MIME type.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  handleStartOnboarding,
  handleSetupBoard,
  handleCreateFirstTask,
  handleExpandBoard,
  handleFinishSetup,
  allToolSchemas
} from "./tools/index.js";
import type {
  SetupBoardInput,
  CreateFirstTaskInput,
  ExpandBoardInput
} from "./lib/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Widget configuration - 5 widgets matching 5 onboarding tools
const WIDGETS = [
  {
    name: "ciello-start",
    tool: "start_onboarding",
    invoking: "Starting onboarding...",
    invoked: "Ready to begin!",
  },
  {
    name: "ciello-board",
    tool: "setup_board",
    invoking: "Creating board...",
    invoked: "Board created!",
  },
  {
    name: "ciello-task",
    tool: "create_first_task",
    invoking: "Adding task...",
    invoked: "Task added!",
  },
  {
    name: "ciello-expand",
    tool: "expand_board",
    invoking: "Expanding board...",
    invoked: "Board expanded!",
  },
  {
    name: "ciello-complete",
    tool: "finish_setup",
    invoking: "Finishing setup...",
    invoked: "Setup complete!",
  },
] as const;

// Map tool names to widget config
const TOOL_TO_WIDGET = new Map<string, typeof WIDGETS[number]>(
  WIDGETS.map(w => [w.tool, w])
);

// Path to widget assets
const ASSETS_PATH = resolve(__dirname, "../../web/assets");

function getWidgetHtml(widgetName: string): string {
  const htmlPath = resolve(ASSETS_PATH, `${widgetName}.html`);
  if (existsSync(htmlPath)) {
    return readFileSync(htmlPath, "utf-8");
  }
  // Fallback placeholder if not built yet
  return `<!doctype html>
<html>
<head><title>Widget: ${widgetName}</title></head>
<body>
  <div id="root">
    <p style="padding: 20px; font-family: system-ui;">
      Widget not built. Run <code>npm run build</code> in the web directory.
    </p>
  </div>
</body>
</html>`;
}

// Helper to create tool metadata for ChatGPT widget integration
function createToolMeta(toolName: string) {
  const widget = TOOL_TO_WIDGET.get(toolName);
  if (!widget) return {};
  
  return {
    "openai/outputTemplate": `ui://widget/${widget.name}.html`,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
  };
}

export function createServer(): Server {
  const server = new Server(
    {
      name: "ciello",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );

  // =========================================================================
  // List Resources (Widget HTML files)
  // =========================================================================
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: WIDGETS.map(widget => ({
        name: widget.name,
        uri: `ui://widget/${widget.name}.html`,
        description: `Ciello widget for ${widget.tool}`,
        mimeType: "text/html+skybridge"
      }))
    };
  });

  // =========================================================================
  // Read Resource (Serve widget HTML)
  // =========================================================================
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    // Parse widget name from URI: ui://widget/{name}.html
    const match = uri.match(/^ui:\/\/widget\/(.+)\.html$/);
    if (!match) {
      throw new Error(`Invalid widget URI: ${uri}`);
    }
    
    const widgetName = match[1];
    const widget = WIDGETS.find(w => w.name === widgetName);
    
    if (!widget) {
      throw new Error(`Unknown widget: ${widgetName}`);
    }
    
    return {
      contents: [{
        uri,
        mimeType: "text/html+skybridge",
        text: getWidgetHtml(widgetName)
      }]
    };
  });

  // =========================================================================
  // List Tools (with ChatGPT widget metadata)
  // =========================================================================
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allToolSchemas.map(schema => ({
        name: schema.name,
        description: schema.description,
        inputSchema: schema.inputSchema,
        _meta: createToolMeta(schema.name)
      }))
    };
  });

  // =========================================================================
  // Handle Tool Calls (with widget metadata in response)
  // =========================================================================
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;
      
      switch (name) {
        case "start_onboarding":
          result = await handleStartOnboarding();
          break;

        case "setup_board":
          result = await handleSetupBoard(args as unknown as SetupBoardInput);
          break;

        case "create_first_task":
          result = await handleCreateFirstTask(args as unknown as CreateFirstTaskInput);
          break;

        case "expand_board":
          result = await handleExpandBoard(args as unknown as ExpandBoardInput);
          break;

        case "finish_setup":
          result = await handleFinishSetup();
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: result.content,
        structuredContent: result.structuredContent,
        _meta: createToolMeta(name)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true
      };
    }
  });

  console.log(`[Server] Registered ${WIDGETS.length} widget resources and ${allToolSchemas.length} tools`);

  return server;
}
