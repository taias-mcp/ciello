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

# Build widgets (self-contained HTML with inlined JS/CSS)
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
1. `start_onboarding` called → Welcome widget renders
2. `setup_board` called → Board creation widget with "Add Task" button
3. User or model progresses through the onboarding flow
4. Widgets render inline with interactive controls

---

## Onboarding Flow

| Step | Tool | Widget | Description |
|------|------|--------|-------------|
| 1 | `start_onboarding` | ciello-start | Welcome message, resets state |
| 2 | `setup_board` | ciello-board | Create board with name & purpose |
| 3 | `create_first_task` | ciello-task | Add first task to board |
| 4 | `expand_board` | ciello-expand | Add more tasks, invite teammate |
| 5 | `finish_setup` | ciello-complete | Completion summary |

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
├── ngrok.yml                  # ngrok tunnel config
├── server/                    # MCP Server
│   ├── src/
│   │   ├── server.ts          # Tool/resource registration
│   │   ├── transports/http.ts # StreamableHTTPServerTransport
│   │   ├── tools/             # 5 onboarding tool handlers
│   │   └── lib/               # Types, Supabase client
│   └── package.json
│
└── web/                       # Widget Frontend
    ├── src/
    │   ├── widgets/           # 5 widget entry points
    │   ├── components/        # Shared React components
    │   ├── hooks/             # window.openai hooks
    │   └── types/             # TypeScript definitions
    ├── assets/                # Build output (gitignored)
    ├── build.mts              # Widget build script
    └── package.json
```

### Widget Development

Each widget is an independent React entry point that:
1. Reads tool output via `window.openai.toolOutput`
2. Triggers follow-up tools via `window.openai.callTool()`
3. Persists UI state via `window.openai.setWidgetState()`

```tsx
import { useOpenAiGlobal } from '../../hooks/use-openai-global';
import { Button } from '@openai/apps-sdk-ui/components/Button';

function MyWidget() {
  const toolOutput = useOpenAiGlobal('toolOutput');
  
  const handleAction = async () => {
    await window.openai.callTool('next_tool', { args });
  };
  
  return (
    <div>
      {/* render tool output */}
      <Button onClick={handleAction}>Next Step</Button>
    </div>
  );
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
