// Tool: expand_board
// Adds more tasks and optionally invites a teammate

import { supabase } from "../lib/supabase.js";
import type { ExpandBoardInput, ExpandBoardOutput, MCPToolResponse } from "../lib/types.js";

// Singleton ID for onboarding state - must match start-onboarding.ts
const ONBOARDING_STATE_ID = "11111111-1111-1111-1111-111111111111";

/**
 * Handle expand_board tool call
 * Adds additional tasks and/or teammate invite
 */
export async function handleExpandBoard(input: ExpandBoardInput): Promise<MCPToolResponse<ExpandBoardOutput>> {
  const { additional_task_titles = [], invite_email } = input;

  console.log("[expand_board] Received request:", { 
    taskCount: additional_task_titles.length, 
    hasInvite: !!invite_email 
  });

  try {
    // Get the current board
    const { data: boards, error: boardError } = await supabase
      .from("boards")
      .select("id, name")
      .limit(1);

    if (boardError || !boards || boards.length === 0) {
      console.error("[expand_board] No board found:", boardError?.message);
      return {
        content: [{ type: "text", text: "No board found. Please create a board first." }],
        structuredContent: {
          message: "No board found",
          currentStep: "first_task",
          board: { id: "", name: "" },
          tasks: [],
          error: {
            code: "NO_BOARD",
            message: "No board exists.",
            suggestion: "Call setup_board to create a board first."
          }
        }
      };
    }

    const board = boards[0];
    console.log("[expand_board] Found board:", board.id);

    // Add new tasks if provided
    if (additional_task_titles.length > 0) {
      const tasksToInsert = additional_task_titles.map(title => ({
        board_id: board.id,
        title: title.trim(),
        status: "todo"
      }));

      const { error: insertError } = await supabase
        .from("tasks")
        .insert(tasksToInsert);

      if (insertError) {
        console.error("[expand_board] Failed to insert tasks:", insertError.message);
      } else {
        console.log("[expand_board] Added", additional_task_titles.length, "tasks");
      }
    }

    // Create invite if email provided
    let inviteResult: { email: string; status: "pending" | "sent" } | undefined;
    if (invite_email) {
      const { data: invite, error: inviteError } = await supabase
        .from("invites")
        .insert({
          board_id: board.id,
          email: invite_email.trim().toLowerCase(),
          status: "pending"
        })
        .select()
        .single();

      if (inviteError) {
        console.error("[expand_board] Failed to create invite:", inviteError.message);
      } else if (invite) {
        console.log("[expand_board] Invite created for:", invite.email);
        inviteResult = {
          email: invite.email,
          status: invite.status
        };
      }
    }

    // Get all tasks for this board
    const { data: allTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, status")
      .eq("board_id", board.id)
      .order("created_at", { ascending: true });

    if (tasksError) {
      console.error("[expand_board] Failed to fetch tasks:", tasksError.message);
    }

    const tasks = (allTasks || []).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status as "todo" | "doing" | "done"
    }));

    // Update onboarding state
    const { error: stateError } = await supabase
      .from("onboarding_state")
      .update({ current_step: "expanded" })
      .eq("id", ONBOARDING_STATE_ID);

    if (stateError) {
      console.error("[expand_board] Failed to update state:", stateError.message);
    }

    // Build response message
    let messageText = `Your board "${board.name}" now has ${tasks.length} task${tasks.length === 1 ? "" : "s"}!`;
    if (inviteResult) {
      messageText += ` An invitation has been sent to ${inviteResult.email}.`;
    }
    messageText += " Ready to finish setup?";

    console.log("[expand_board] Complete, total tasks:", tasks.length);

    return {
      content: [{ type: "text", text: messageText }],
      structuredContent: {
        message: messageText,
        currentStep: "expanded",
        board: {
          id: board.id,
          name: board.name
        },
        tasks,
        invite: inviteResult
      }
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[expand_board] Unexpected error:", message);
    return {
      content: [{ type: "text", text: `Error expanding board: ${message}` }],
      structuredContent: {
        message: "Failed to expand board",
        currentStep: "first_task",
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
