// JSON Schema objects for MCP tool registration
// 5 stateless tools for the Ciello onboarding flow

export const startOnboardingSchema = {
  name: "start_onboarding",
  description:
    "Start the Ciello onboarding flow. Creates a fresh session and prepares the user to set up their first board. This resets any existing onboarding progress.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {},
    required: []
  }
} as const;

export const setupBoardSchema = {
  name: "setup_board",
  description:
    "Create the user's first board with a name and purpose. This is the second step of onboarding after starting.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      board_name: {
        type: "string",
        description: "Name for the new board (e.g., 'Marketing Launch', 'Product Roadmap')"
      },
      board_purpose: {
        type: "string",
        description: "Brief description of what this board will be used for"
      }
    },
    required: ["board_name", "board_purpose"]
  }
} as const;

export const createFirstTaskSchema = {
  name: "create_first_task",
  description:
    "Add the first task to the user's board. If no title is provided, a helpful placeholder task will be created automatically.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      task_title: {
        type: "string",
        description: "Title for the first task. If omitted, a default task will be created."
      }
    },
    required: []
  }
} as const;

export const expandBoardSchema = {
  name: "expand_board",
  description:
    "Expand the board by adding more tasks and optionally inviting a teammate. This helps the user see their board come to life.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      additional_task_titles: {
        type: "array",
        items: { type: "string" },
        description: "Array of task titles to add to the board"
      },
      invite_email: {
        type: "string",
        description: "Email address of a teammate to invite (simulated)"
      }
    },
    required: []
  }
} as const;

export const finishSetupSchema = {
  name: "finish_setup",
  description:
    "Complete the onboarding flow and show a summary of everything created. This marks the user as fully onboarded.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {},
    required: []
  }
} as const;

// Export all schemas as an array for easy registration
export const allToolSchemas = [
  startOnboardingSchema,
  setupBoardSchema,
  createFirstTaskSchema,
  expandBoardSchema,
  finishSetupSchema
] as const;
