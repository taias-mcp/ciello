// Types synced from server/src/lib/types.ts
// 5 stateless onboarding tools for Ciello

// ============================================================================
// Common Types
// ============================================================================

export interface ToolError {
  code: string;
  message: string;
  suggestion: string;
}

export type OnboardingStep = 
  | 'not_started' 
  | 'started' 
  | 'board_created' 
  | 'first_task' 
  | 'expanded' 
  | 'complete';

export type TaskStatus = 'todo' | 'doing' | 'done';

export type InviteStatus = 'pending' | 'sent';

// ============================================================================
// start_onboarding Output
// ============================================================================

export interface StartOnboardingOutput {
  message: string;
  currentStep: OnboardingStep;
  startedAt: string;
  error?: ToolError;
}

// ============================================================================
// setup_board Output
// ============================================================================

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

// ============================================================================
// create_first_task Output
// ============================================================================

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

// ============================================================================
// expand_board Output
// ============================================================================

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

// ============================================================================
// finish_setup Output
// ============================================================================

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
