// Tool: setup_board
// Creates the user's first board with name and purpose

import { supabase } from "../lib/supabase.js";
import type { SetupBoardInput, SetupBoardOutput, MCPToolResponse } from "../lib/types.js";

// Singleton ID for onboarding state - must match start-onboarding.ts
const ONBOARDING_STATE_ID = "11111111-1111-1111-1111-111111111111";

/**
 * Handle setup_board tool call
 * Creates a new board and updates onboarding state
 * Validates that onboarding is in the correct state first
 */
export async function handleSetupBoard(input: SetupBoardInput): Promise<MCPToolResponse<SetupBoardOutput>> {
  const { board_name, board_purpose } = input;

  console.log("[setup_board] Received request:", { board_name, board_purpose });

  try {
    // Validate onboarding state first
    const { data: currentState, error: stateCheckError } = await supabase
      .from("onboarding_state")
      .select("current_step")
      .eq("id", ONBOARDING_STATE_ID)
      .single();

    if (stateCheckError || !currentState) {
      console.error("[setup_board] No active onboarding session found:", stateCheckError?.message);
      return {
        content: [{ type: "text", text: "No active onboarding session. Please start onboarding first with start_onboarding." }],
        structuredContent: {
          message: "No active onboarding session",
          currentStep: "not_started",
          board: { id: "", name: "", purpose: "" },
          error: {
            code: "NO_ACTIVE_SESSION",
            message: "Onboarding has not been started",
            suggestion: "Call start_onboarding first to begin the onboarding flow."
          }
        }
      };
    }

    // Check if we're in the right step (allow "started" or "board_created" for idempotency)
    if (currentState.current_step !== "started" && currentState.current_step !== "board_created") {
      console.warn("[setup_board] Invalid state for setup_board:", currentState.current_step);
      return {
        content: [{ type: "text", text: `Cannot create board in current state: ${currentState.current_step}. Please start a new onboarding session.` }],
        structuredContent: {
          message: `Invalid onboarding state: ${currentState.current_step}`,
          currentStep: currentState.current_step,
          board: { id: "", name: "", purpose: "" },
          error: {
            code: "INVALID_STATE",
            message: `Expected state 'started', got '${currentState.current_step}'`,
            suggestion: "Call start_onboarding to reset and begin a new onboarding flow."
          }
        }
      };
    }

    // Check if board already exists (for idempotency on retries)
    const { data: existingBoard } = await supabase
      .from("boards")
      .select("id, name, purpose")
      .limit(1)
      .single();

    if (existingBoard) {
      console.log("[setup_board] Board already exists, returning existing:", existingBoard.id);
      return {
        content: [{ type: "text", text: `Your board "${existingBoard.name}" is ready. Now let's add your first task to get things rolling.` }],
        structuredContent: {
          message: `Board "${existingBoard.name}" is ready!`,
          currentStep: "board_created",
          board: {
            id: existingBoard.id,
            name: existingBoard.name,
            purpose: existingBoard.purpose || ""
          }
        }
      };
    }

    // Create the board
    console.log("[setup_board] Creating new board...");
    const { data: board, error: boardError } = await supabase
      .from("boards")
      .insert({
        name: board_name,
        purpose: board_purpose
      })
      .select()
      .single();

    if (boardError) {
      console.error("[setup_board] Failed to create board:", boardError.message);
      return {
        content: [{ type: "text", text: `Failed to create board: ${boardError.message}` }],
        structuredContent: {
          message: "Failed to create board",
          currentStep: "started",
          board: { id: "", name: "", purpose: "" },
          error: {
            code: "BOARD_CREATE_FAILED",
            message: boardError.message,
            suggestion: "Try again with a different board name."
          }
        }
      };
    }

    console.log("[setup_board] Board created:", board.id);

    // Update onboarding state
    const { error: stateError } = await supabase
      .from("onboarding_state")
      .update({ current_step: "board_created" })
      .eq("id", ONBOARDING_STATE_ID);

    if (stateError) {
      console.error("[setup_board] Failed to update state:", stateError.message);
    }

    console.log("[setup_board] Setup complete");

    return {
      content: [{ type: "text", text: `Great! Your board "${board_name}" has been created. Now let's add your first task to get things rolling.` }],
      structuredContent: {
        message: `Board "${board_name}" created successfully!`,
        currentStep: "board_created",
        board: {
          id: board.id,
          name: board.name,
          purpose: board.purpose || ""
        }
      }
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[setup_board] Unexpected error:", message);
    return {
      content: [{ type: "text", text: `Error creating board: ${message}` }],
      structuredContent: {
        message: "Failed to create board",
        currentStep: "started",
        board: { id: "", name: "", purpose: "" },
        error: {
          code: "UNEXPECTED_ERROR",
          message,
          suggestion: "Check database connection and try again."
        }
      }
    };
  }
}
