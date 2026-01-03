/**
 * Tool: finish_setup
 * 
 * Completes the onboarding flow and returns a summary of everything created.
 * This marks the user as fully onboarded.
 * 
 * Flow: start_onboarding → setup_board → create_first_task → expand_board → finish_setup
 */

import { supabase } from "../lib/supabase.js";
import type { OnboardingStep, TaskStatus, ToolError, MCPToolResponse } from "../lib/types.js";

// ============================================================================
// Tool Schema (for MCP registration)
// ============================================================================

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

// ============================================================================
// Types
// ============================================================================

/** Output returned to ChatGPT and the widget */
export interface FinishSetupOutput {
  message: string;
  currentStep: OnboardingStep;
  completedAt: string;
  summary: {
    boardName: string;
    boardPurpose: string;
    taskCount: number;
    tasks: Array<{
      title: string;
      status: TaskStatus;
    }>;
    invitedTeammate: string | null;
  };
  error?: ToolError;
}

// ============================================================================
// Constants
// ============================================================================

/** Singleton ID for onboarding state - must match start-onboarding.ts */
const ONBOARDING_STATE_ID = "11111111-1111-1111-1111-111111111111";

// ============================================================================
// Handler
// ============================================================================

/**
 * Handle finish_setup tool call
 * 
 * Marks onboarding complete and returns summary.
 */
export async function handleFinishSetup(): Promise<MCPToolResponse<FinishSetupOutput>> {
  console.log("[finish_setup] Finishing onboarding...");

  try {
    const completedAt = new Date().toISOString();

    // Update onboarding state to complete
    const { error: stateError } = await supabase
      .from("onboarding_state")
      .update({
        current_step: "complete",
        completed_at: completedAt
      })
      .eq("id", ONBOARDING_STATE_ID);

    if (stateError) {
      console.error("[finish_setup] Failed to update state:", stateError.message);
    }

    // Get board info
    const { data: boards, error: boardsError } = await supabase
      .from("boards")
      .select("name, purpose")
      .limit(1);

    if (boardsError) {
      console.error("[finish_setup] Failed to fetch boards:", boardsError.message);
    }

    const board = boards?.[0] || { name: "Your Board", purpose: "" };

    // Get all tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("title, status")
      .order("created_at", { ascending: true });

    if (tasksError) {
      console.error("[finish_setup] Failed to fetch tasks:", tasksError.message);
    }

    const taskList = (tasks || []).map(t => ({
      title: t.title,
      status: t.status as TaskStatus
    }));

    // Get invite if any
    const { data: invites, error: invitesError } = await supabase
      .from("invites")
      .select("email")
      .limit(1);

    if (invitesError) {
      console.error("[finish_setup] Failed to fetch invites:", invitesError.message);
    }

    const invitedTeammate = invites?.[0]?.email || null;

    // Build summary message
    let summaryText = `🎉 Setup complete! Your board "${board.name}" is ready with ${taskList.length} task${taskList.length === 1 ? "" : "s"}.`;
    if (invitedTeammate) {
      summaryText += ` ${invitedTeammate} has been invited to collaborate.`;
    }

    console.log("[finish_setup] Onboarding complete:", { 
      boardName: board.name, 
      taskCount: taskList.length,
      hasInvite: !!invitedTeammate 
    });

    return {
      content: [{ type: "text", text: summaryText }],
      structuredContent: {
        message: "Onboarding complete!",
        currentStep: "complete",
        completedAt,
        summary: {
          boardName: board.name,
          boardPurpose: board.purpose || "",
          taskCount: taskList.length,
          tasks: taskList,
          invitedTeammate
        }
      }
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[finish_setup] Unexpected error:", message);
    return {
      content: [{ type: "text", text: `Error finishing setup: ${message}` }],
      structuredContent: {
        message: "Failed to complete setup",
        currentStep: "expanded",
        completedAt: "",
        summary: {
          boardName: "",
          boardPurpose: "",
          taskCount: 0,
          tasks: [],
          invitedTeammate: null
        },
        error: {
          code: "UNEXPECTED_ERROR",
          message,
          suggestion: "Check database connection and try again."
        }
      }
    };
  }
}
