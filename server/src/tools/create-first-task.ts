// Tool: create_first_task
// Adds the first task to the user's board

import { supabase } from "../lib/supabase.js";
import type { CreateFirstTaskInput, CreateFirstTaskOutput, MCPToolResponse } from "../lib/types.js";

// Singleton ID for onboarding state - must match start-onboarding.ts
const ONBOARDING_STATE_ID = "11111111-1111-1111-1111-111111111111";

// Default task title if none provided
const DEFAULT_TASK_TITLE = "Review onboarding guide";

/**
 * Handle create_first_task tool call
 * Creates the first task on the board
 */
export async function handleCreateFirstTask(input: CreateFirstTaskInput): Promise<MCPToolResponse<CreateFirstTaskOutput>> {
  const taskTitle = input.task_title?.trim() || DEFAULT_TASK_TITLE;

  console.log("[create_first_task] Received request:", { taskTitle });

  try {
    // Get the current board
    const { data: boards, error: boardError } = await supabase
      .from("boards")
      .select("id, name")
      .limit(1);

    if (boardError || !boards || boards.length === 0) {
      console.error("[create_first_task] No board found:", boardError?.message);
      return {
        content: [{ type: "text", text: "No board found. Please create a board first using setup_board." }],
        structuredContent: {
          message: "No board found",
          currentStep: "started",
          board: { id: "", name: "" },
          tasks: [],
          error: {
            code: "NO_BOARD",
            message: "No board exists. Create a board first.",
            suggestion: "Call setup_board to create a board before adding tasks."
          }
        }
      };
    }

    const board = boards[0];
    console.log("[create_first_task] Found board:", board.id);

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        board_id: board.id,
        title: taskTitle,
        status: "todo"
      })
      .select()
      .single();

    if (taskError) {
      console.error("[create_first_task] Failed to create task:", taskError.message);
      return {
        content: [{ type: "text", text: `Failed to create task: ${taskError.message}` }],
        structuredContent: {
          message: "Failed to create task",
          currentStep: "board_created",
          board: { id: board.id, name: board.name },
          tasks: [],
          error: {
            code: "TASK_CREATE_FAILED",
            message: taskError.message,
            suggestion: "Try again with a different task title."
          }
        }
      };
    }

    console.log("[create_first_task] Task created:", task.id);

    // Update onboarding state
    const { error: stateError } = await supabase
      .from("onboarding_state")
      .update({ current_step: "first_task" })
      .eq("id", ONBOARDING_STATE_ID);

    if (stateError) {
      console.error("[create_first_task] Failed to update state:", stateError.message);
    }

    console.log("[create_first_task] Complete");

    return {
      content: [{ type: "text", text: `Your first task "${taskTitle}" has been added to ${board.name}! Want to expand your board with more tasks or invite a teammate?` }],
      structuredContent: {
        message: `Task "${taskTitle}" created!`,
        currentStep: "first_task",
        board: {
          id: board.id,
          name: board.name
        },
        tasks: [{
          id: task.id,
          title: task.title,
          status: task.status
        }]
      }
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create_first_task] Unexpected error:", message);
    return {
      content: [{ type: "text", text: `Error creating task: ${message}` }],
      structuredContent: {
        message: "Failed to create task",
        currentStep: "board_created",
        board: { id: "", name: "" },
        tasks: [],
        error: {
          code: "UNEXPECTED_ERROR",
          message,
          suggestion: "Check database connection and try again."
        }
      }
    };
  }
}
