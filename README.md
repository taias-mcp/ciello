# Ciello - ChatGPT Team Task Board Demo

A ChatGPT App / MCP server for a Trello-like team task board onboarding experience.

## Quick Start

### Prerequisites

- Node.js 18+
- ngrok installed (`brew install ngrok` or [download](https://ngrok.com/download))
- ngrok account (free tier works)
- Supabase project with tables configured

### 1. Install Dependencies

```bash
# Server
cd server && npm install

# Web widgets
cd ../web && npm install
```

### 2. Configure Environment

Create a `.env` file in the server directory (copy from `.env.example`):

```bash
cd server
cp .env.example .env
```

Add Supabase environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
```

### 3. Build Everything

```bash
# Build server
cd server && npm run build

# Build widget (self-contained HTML with inlined JS/CSS)
cd ../web && npm run build
```

### 4. Start the Server

**Option A: Use the demo script (recommended)**

```bash
./demo.sh
```

This starts the MCP server and ngrok tunnel, then prints the ChatGPT connector URL.

**Option B: Manual startup**

```bash
# Terminal 1: Start MCP server
cd server && npm run start:http

# Terminal 2: Start ngrok
ngrok http 3001
```

Note the public URL (e.g., `https://abc123.ngrok-free.app`).

### 5. Connect to ChatGPT

1. Go to ChatGPT → Settings → Apps
2. Click **"Create App"**
3. Enter the **MCP tunnel URL** with `/mcp` path:
   ```
   https://<mcp-id>.ngrok-free.app/mcp
   ```
4. Name it "Ciello"
5. Start a new chat and select the Ciello app

### 6. Test It!

Say: *"Help me set up my first board for tracking our marketing campaign"*

You should see:
1. `start_onboarding` called → Widget renders with "Create Board" form
2. User fills form, clicks CTA → Widget updates to next step
3. User progresses through all 5 steps within the same widget
4. Final step shows completion summary with board preview

---

## Architecture Overview

This demo uses a **unified widget architecture** - a single React widget handles all 5 onboarding steps. Each tool returns data that the widget uses to render the appropriate step.

```
ChatGPT ←→ MCP Server ←→ Supabase
              ↓
         Widget (React)
```

For a detailed explanation of how data flows between ChatGPT, MCP, and the widget, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Onboarding Flow

| Step | Tool | Description |
|------|------|-------------|
| 1 | `start_onboarding` | Resets state, shows welcome + board creation form |
| 2 | `setup_board` | Creates board, shows task creation form |
| 3 | `create_first_task` | Adds first task, shows expand options |
| 4 | `expand_board` | Adds more tasks + invites, shows finish option |
| 5 | `finish_setup` | Marks complete, shows summary |

All 5 tools render the same **ciello-onboarding** widget, which dynamically shows the appropriate UI based on `currentStep` in the tool output.

---

## Database Schema

The MCP server persists state in Supabase with these tables:

```sql
-- Tracks onboarding progress
CREATE TABLE onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_step TEXT NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- User's board
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks on the board
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teammate invites
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## URL Reference

| Service | Local URL | ngrok URL (example) |
|---------|-----------|---------------------|
| MCP Server | `http://localhost:3001/mcp` | `https://abc123.ngrok-free.app/mcp` |

---

## Common Pitfalls

### ngrok URLs change on restart

**Problem:** Free ngrok domains are randomly generated. Restarting ngrok gives you new URLs.

**Solution:** After restarting ngrok, update your ChatGPT connector with the new URL.

### Widget shows "Loading..." forever

**Problem:** MCP server not running or ngrok not connected.

**Debug:**
1. Check server: `curl http://localhost:3001/health`
2. Check ngrok: Visit your ngrok URL in browser

### Supabase connection errors

**Problem:** Missing or invalid environment variables.

**Debug:**
1. Verify `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are set
2. Check Supabase project is active
3. Verify tables exist in database

---

## Development

### Project Structure

```
ciello/
├── ARCHITECTURE.md            # Data flow and widget architecture
├── ngrok.yml                  # ngrok tunnel config
├── server/                    # MCP Server
│   ├── src/
│   │   ├── server.ts          # Tool/resource registration, widget binding
│   │   ├── transports/http.ts # StreamableHTTPServerTransport
│   │   ├── tools/             # 5 self-contained tool files
│   │   │   ├── start-onboarding.ts   # Schema + types + handler
│   │   │   ├── setup-board.ts
│   │   │   ├── create-first-task.ts
│   │   │   ├── expand-board.ts
│   │   │   └── finish-setup.ts
│   │   └── lib/               # Shared types, Supabase client
│   └── package.json
│
└── web/                       # Widget Frontend
    ├── src/
    │   ├── widgets/
    │   │   └── ciello-onboarding/    # Unified widget (handles all steps)
    │   ├── hooks/             # window.openai hooks
    │   └── types/             # TypeScript definitions
    ├── assets/                # Build output (gitignored)
    ├── build.mts              # Widget build script
    └── package.json
```

### Tool Structure

Each tool is **self-contained** in a single file with:
- Schema (name, description, inputSchema)
- TypeScript types (input/output interfaces)  
- Handler function

```typescript
// server/src/tools/setup-board.ts

// Schema for MCP registration
export const setupBoardSchema = {
  name: "setup_board",
  description: "Create the user's first board...",
  inputSchema: { ... }
};

// Types
export interface SetupBoardInput { ... }
export interface SetupBoardOutput { ... }

// Handler
export async function handleSetupBoard(input: SetupBoardInput): Promise<...> {
  // Implementation
}
```

### Widget Architecture

The widget uses a **unified pattern** where one React component handles all steps:

1. **Initialize**: Read `toolOutput` from `window.openai` via hook
2. **Render**: Show form/UI based on `currentStep`
3. **User Action**: Call `window.openai.callTool()` with next tool
4. **Update**: Update React state with response, re-render next step

```tsx
function CielloOnboarding() {
  const toolOutput = useOpenAiGlobal('toolOutput');
  const [state, setState] = useState(() => ({
    step: toolOutput?.currentStep ?? "started",
    board: toolOutput?.board ?? null,
    // ...
  }));

  const handleSubmit = async () => {
    const response = await window.openai.callTool("setup_board", { ... });
    setState(prev => ({
      ...prev,
      step: response.structuredContent.currentStep,
      board: response.structuredContent.board,
    }));
  };

  // Render based on state.step
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | MCP server port |
| `SUPABASE_URL` | - | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | - | Supabase publishable API key |

---

## License

MIT
