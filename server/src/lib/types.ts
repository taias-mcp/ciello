/**
 * Shared TypeScript types for Ciello MCP Server
 * 
 * Only contains types used across multiple tools.
 * Tool-specific types (input/output) are defined in each tool file.
 */

// ============================================================================
// Onboarding Flow
// ============================================================================

/** The possible states of the onboarding flow */
export type OnboardingStep = 
  | "not_started" 
  | "started" 
  | "board_created" 
  | "first_task" 
  | "expanded" 
  | "complete";

// ============================================================================
// Task & Invite Status
// ============================================================================

/** Task status in the Kanban board */
export type TaskStatus = "todo" | "doing" | "done";

/** Invite status for teammate invitations */
export type InviteStatus = "pending" | "sent";

// ============================================================================
// Error Handling
// ============================================================================

/** Standard error structure for graceful failures */
export interface ToolError {
  code: string;
  message: string;
  suggestion: string;
}

// ============================================================================
// MCP Response
// ============================================================================

/**
 * Standard MCP tool response structure.
 * 
 * - `content`: Text shown to the user in the chat
 * - `structuredContent`: Data passed to the widget via window.openai.toolOutput
 */
export interface MCPToolResponse<T> {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: T;
}
