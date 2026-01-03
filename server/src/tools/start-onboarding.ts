// Tool: start_onboarding
// Resets the onboarding state and starts fresh

import { supabase } from "../lib/supabase.js";
import type { StartOnboardingOutput, MCPToolResponse } from "../lib/types.js";

// Singleton ID for onboarding state - ensures idempotency on retries
const ONBOARDING_STATE_ID = "11111111-1111-1111-1111-111111111111";

/**
 * Handle start_onboarding tool call
 * Clears all existing data and creates/resets the onboarding state
 * Uses singleton pattern to handle duplicate/retry calls safely
 */
export async function handleStartOnboarding(): Promise<MCPToolResponse<StartOnboardingOutput>> {
  console.log("[start_onboarding] Starting onboarding flow...");
  
  try {
    // Clear existing data in reverse dependency order with error checking
    const { error: invitesError } = await supabase
      .from("invites")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (invitesError) {
      console.error("[start_onboarding] Failed to clear invites:", invitesError.message);
    }

    const { error: tasksError } = await supabase
      .from("tasks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (tasksError) {
      console.error("[start_onboarding] Failed to clear tasks:", tasksError.message);
    }

    const { error: boardsError } = await supabase
      .from("boards")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (boardsError) {
      console.error("[start_onboarding] Failed to clear boards:", boardsError.message);
    }

    // Upsert the singleton onboarding state (idempotent - safe for retries)
    const now = new Date().toISOString();
    const { data: state, error } = await supabase
      .from("onboarding_state")
      .upsert({
        id: ONBOARDING_STATE_ID,
        current_step: "started",
        started_at: now,
        completed_at: null
      }, {
        onConflict: "id"
      })
      .select()
      .single();

    if (error) {
      console.error("[start_onboarding] Failed to upsert state:", error.message);
      return {
        content: [{ type: "text", text: `Failed to start onboarding: ${error.message}` }],
        structuredContent: {
          message: "Failed to start onboarding",
          currentStep: "not_started",
          startedAt: "",
          error: {
            code: "START_FAILED",
            message: error.message,
            suggestion: "Check database connection and try again."
          }
        }
      };
    }

    console.log("[start_onboarding] Onboarding started successfully, state ID:", state.id);

    return {
      content: [{ type: "text", text: "Welcome to Ciello! Let's set up your first board. I'll guide you through creating a board, adding tasks, and optionally inviting a teammate." }],
      structuredContent: {
        message: "Onboarding started! Ready to create your first board.",
        currentStep: "started",
        startedAt: state.started_at
      }
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[start_onboarding] Unexpected error:", message);
    return {
      content: [{ type: "text", text: `Error starting onboarding: ${message}` }],
      structuredContent: {
        message: "Failed to start onboarding",
        currentStep: "not_started",
        startedAt: "",
        error: {
          code: "UNEXPECTED_ERROR",
          message,
          suggestion: "Check database connection and try again."
        }
      }
    };
  }
}
