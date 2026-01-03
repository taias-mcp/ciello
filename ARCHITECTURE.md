# Ciello Architecture

This document explains how ChatGPT, the MCP server, and the widget communicate to create the onboarding experience.

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  ChatGPT                                    │
│                                                                             │
│  1. User: "I want to onboard to @Ciello"                                    │
│  2. ChatGPT decides to call start_onboarding tool                           │
│                                                                             │
│                              ┌─────────────┐                                │
│                              │  Tool Call  │                                │
│                              └──────┬──────┘                                │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               MCP Server                                    │
│                                                                             │
│  3. Server executes tool handler                                            │
│  4. Returns response with _meta pointing to widget                          │
│                                                                             │
│     {                                                                       │
│       content: [{ type: "text", text: "Welcome to Ciello!" }],              │
│       structuredContent: {                                                  │
│         currentStep: "started",                                             │
│         message: "Ready to create your first board"                         │
│       },                                                                    │
│       _meta: {                                                              │
│         "openai/outputTemplate": "ui://widget/ciello-onboarding.html"       │
│       }                                                                     │
│     }                                                                       │
│                                                                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  ChatGPT                                    │
│                                                                             │
│  5. ChatGPT sees _meta.openai/outputTemplate                                │
│  6. Fetches widget HTML from MCP server (ReadResource)                      │
│  7. Renders widget in iframe                                                │
│  8. Passes structuredContent to widget via window.openai.toolOutput         │
│                                                                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Widget (React)                                   │
│                                                                             │
│  9. Widget reads toolOutput via useOpenAiGlobal hook                        │
│ 10. Initializes state: step="started", board=null, tasks=[]                 │
│ 11. Renders "Step 1: Create Your Board" form                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The `_meta` Object

The key to widget integration is the `_meta` object in tool responses. This is OpenAI-specific metadata that tells ChatGPT how to render the tool's output.

```typescript
// server/src/server.ts

function createToolMeta(toolName: string) {
  return {
    // Which widget to render for this tool's output
    "openai/outputTemplate": "ui://widget/ciello-onboarding.html",
    
    // Message shown while tool is executing
    "openai/toolInvocation/invoking": "Creating board...",
    
    // Message shown after tool completes
    "openai/toolInvocation/invoked": "Board created!",
    
    // Allow widget to call tools directly
    "openai/widgetAccessible": true,
  };
}
```

### Widget URI Format

The `openai/outputTemplate` value uses a special URI format:

```
ui://widget/{name}.html
```

ChatGPT resolves this by calling the MCP server's `ReadResource` handler with this URI. The server returns the widget HTML.

## How `structuredContent` Becomes `toolOutput`

When ChatGPT renders a widget:

1. **Tool Response**: Server returns `{ content, structuredContent, _meta }`
2. **ChatGPT Processing**: ChatGPT extracts `structuredContent`
3. **Widget Injection**: ChatGPT sets `window.openai.toolOutput = structuredContent`
4. **React Hook**: Widget's `useOpenAiGlobal("toolOutput")` returns this data

```typescript
// In the widget
const toolOutput = useOpenAiGlobal("toolOutput");
// toolOutput = { currentStep: "started", message: "...", ... }
```

## User Interaction: `callTool()` Flow

When the user clicks a button that triggers a tool call:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Widget (React)                                   │
│                                                                             │
│  User fills form, clicks "Create Board"                                     │
│                                                                             │
│  const response = await window.openai.callTool("setup_board", {             │
│    board_name: "Marketing Launch",                                          │
│    board_purpose: "Track Q1 campaign tasks"                                 │
│  });                                                                        │
│                                                                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  ChatGPT                                    │
│                                                                             │
│  Routes tool call to MCP server                                             │
│                                                                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               MCP Server                                    │
│                                                                             │
│  Executes setup_board handler:                                              │
│  - Creates board in Supabase                                                │
│  - Returns new structuredContent with currentStep: "board_created"          │
│                                                                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Widget (React)                                   │
│                                                                             │
│  callTool() resolves with response                                          │
│                                                                             │
│  // Response structure:                                                     │
│  {                                                                          │
│    structuredContent: {                                                     │
│      currentStep: "board_created",                                          │
│      board: { id: "...", name: "Marketing Launch", purpose: "..." }         │
│    }                                                                        │
│  }                                                                          │
│                                                                             │
│  Widget updates React state → Re-renders with "Step 2: Add First Task"      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Insight: No New Widget

Unlike the initial tool call (where ChatGPT renders a new widget), `callTool()` updates data within the current widget instance. Switching to a different widget template generally requires a new host turn (e.g., via `sendFollowUpMessage` leading to another tool call).

When using `callTool()`:

1. The response is returned directly to the calling widget
2. The widget is responsible for updating its own state
3. The widget re-renders with the new data

This is why we use a **unified widget** - it can handle all steps internally.

## Unified Widget Pattern

Instead of 5 separate widgets (one per tool), we use a single widget that:

1. Reads `currentStep` from `toolOutput`
2. Renders the appropriate form/UI for that step
3. On form submission, calls the next tool
4. Updates its own state with the response
5. Re-renders for the next step

```typescript
function CielloOnboarding() {
  // Initialize from toolOutput
  const [state, setState] = useState(() => ({
    step: toolOutput?.currentStep ?? "started",
    board: toolOutput?.board ?? null,
    tasks: toolOutput?.tasks ?? [],
  }));

  const handleSubmit = async () => {
    // Call the appropriate tool for the current step
    const response = await window.openai.callTool(config.tool, params);
    
    // Update state with response (stays in current widget)
    setState({
      step: response.structuredContent.currentStep,
      board: response.structuredContent.board ?? state.board,
      tasks: response.structuredContent.tasks ?? state.tasks,
    });
  };

  // Render based on state.step
  switch (state.step) {
    case "started": return <BoardCreationForm />;
    case "board_created": return <TaskCreationForm />;
    // ...
  }
}
```

## Alternative: Multi-Widget Pattern

If each tool had its own widget, the flow would be:

1. Tool A renders Widget A
2. Widget A calls Tool B
3. ChatGPT would need to render Widget B (but it doesn't - `callTool()` returns to Widget A)
4. Widget A would be stuck

This is why the unified widget pattern works better for multi-step flows where the widget needs to drive the interaction.

## Widget ↔ Tool Binding

All 5 tools are bound to the same widget in `server.ts`:

```typescript
// All tools point to the same widget
const UNIFIED_WIDGET = {
  name: "ciello-onboarding",
  uri: "ui://widget/ciello-onboarding.html",
};

// Every tool gets the same _meta
function createToolMeta(toolName: string) {
  return {
    "openai/outputTemplate": UNIFIED_WIDGET.uri,
    // ...
  };
}
```

The widget then uses `currentStep` in the response to determine which UI to show.

## File Reference

| File | Purpose |
|------|---------|
| `server/src/server.ts` | Tool registration, widget binding via `_meta` |
| `server/src/tools/*.ts` | Individual tool schemas + handlers |
| `web/src/widgets/ciello-onboarding/` | Unified widget React component |
| `web/src/hooks/use-openai-global.ts` | Hook to read `window.openai` values |

