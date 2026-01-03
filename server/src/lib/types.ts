// Shared TypeScript types for Ciello MCP Server
// 5 stateless onboarding tools with Supabase persistence

// ============================================================================
// Common Types
// ============================================================================

/**
 * Standard error structure for graceful failures
 */
export interface ToolError {
  code: string;
  message: string;
  suggestion: string;
}

// ============================================================================
// Database Row Types (matching Supabase schema)
// ============================================================================

export type OnboardingStep = 
  | 'not_started' 
  | 'started' 
  | 'board_created' 
  | 'first_task' 
  | 'expanded' 
  | 'complete';

export interface OnboardingState {
  id: string;
  current_step: OnboardingStep;
  started_at: string | null;
  completed_at: string | null;
}

export interface Board {
  id: string;
  name: string;
  purpose: string | null;
  created_at: string;
}

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  board_id: string;
  title: string;
  status: TaskStatus;
  created_at: string;
}

export type InviteStatus = 'pending' | 'sent';

export interface Invite {
  id: string;
  board_id: string;
  email: string;
  status: InviteStatus;
  created_at: string;
}

// ============================================================================
// Tool Input Types
// ============================================================================

// start_onboarding has no inputs

export interface SetupBoardInput {
  board_name: string;
  board_purpose: string;
}

export interface CreateFirstTaskInput {
  task_title?: string;
}

export interface ExpandBoardInput {
  additional_task_titles?: string[];
  invite_email?: string;
}

// finish_setup has no inputs

// ============================================================================
// Tool Output Types
// ============================================================================

export interface StartOnboardingOutput {
  message: string;
  currentStep: OnboardingStep;
  startedAt: string;
  error?: ToolError;
}

export interface SetupBoardOutput {
  message: string;
  currentStep: OnboardingStep;
  board: {
    id: string;
    name: string;
    purpose: string;
  };
  error?: ToolError;
}

export interface CreateFirstTaskOutput {
  message: string;
  currentStep: OnboardingStep;
  board: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
    status: TaskStatus;
  };
  error?: ToolError;
}

export interface ExpandBoardOutput {
  message: string;
  currentStep: OnboardingStep;
  board: {
    id: string;
    name: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
  }>;
  invite?: {
    email: string;
    status: InviteStatus;
  };
  error?: ToolError;
}

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
// MCP Response Types
// ============================================================================

export interface MCPToolResponse<T> {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: T;
}
