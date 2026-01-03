import { createRoot } from "react-dom/client";
import { useState } from "react";
import { useOpenAiGlobal } from "../../hooks/use-openai-global";
import "../../styles/index.css";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Input } from "@openai/apps-sdk-ui/components/Input";
import { LoadingIndicator } from "@openai/apps-sdk-ui/components/Indicator";
import { 
  ArrowRight, 
  Plus, 
  X, 
  Clipboard, 
  Mail,
  Check 
} from "@openai/apps-sdk-ui/components/Icon";

// ============================================================================
// Types
// ============================================================================

type OnboardingStep = 
  | "started" 
  | "board_created" 
  | "first_task" 
  | "expanded" 
  | "complete";

interface BoardData {
  id: string;
  name: string;
  purpose: string;
}

interface TaskData {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
}

interface InviteData {
  email: string;
  status: string;
}

interface OnboardingState {
  step: OnboardingStep;
  board: BoardData | null;
  tasks: TaskData[];
  invite: InviteData | null;
  lastActionMessage: string | null;
}

interface FormData {
  boardName: string;
  boardPurpose: string;
  taskTitle: string;
  additionalTasks: string[];
  newTaskInput: string;
  inviteEmail: string;
}

// Tool output type from start_onboarding
interface InitialToolOutput {
  message: string;
  currentStep: OnboardingStep;
  startedAt?: string;
  board?: BoardData;
  tasks?: TaskData[];
  invite?: InviteData;
  error?: {
    code: string;
    message: string;
    suggestion: string;
  };
}

// ============================================================================
// Step Configuration
// ============================================================================

const STEP_CONFIG: Record<OnboardingStep, {
  number: number;
  title: string;
  description: string;
  ctaLabel: string;
  tool: string;
}> = {
  started: {
    number: 1,
    title: "Welcome to Ciello!",
    description: "Let's set up your workspace",
    ctaLabel: "Create Board",
    tool: "setup_board",
  },
  board_created: {
    number: 2,
    title: "Board Created!",
    description: "Now let's add your first task",
    ctaLabel: "Add First Task",
    tool: "create_first_task",
  },
  first_task: {
    number: 3,
    title: "Task Added!",
    description: "Expand your board with more tasks and teammates",
    ctaLabel: "Continue",
    tool: "expand_board",
  },
  expanded: {
    number: 4,
    title: "Board Expanded!",
    description: "Ready to finish setup",
    ctaLabel: "Finish Setup",
    tool: "finish_setup",
  },
  complete: {
    number: 4,
    title: "All Done!",
    description: "Your workspace is ready",
    ctaLabel: "",
    tool: "",
  },
};

// ============================================================================
// Main Widget Component
// ============================================================================

function CielloOnboarding() {
  const toolOutput = useOpenAiGlobal("toolOutput") as InitialToolOutput | null;
  
  // Initialize state from toolOutput
  const [state, setState] = useState<OnboardingState>(() => ({
    step: toolOutput?.currentStep ?? "started",
    board: toolOutput?.board ?? null,
    tasks: toolOutput?.tasks ?? [],
    invite: toolOutput?.invite ?? null,
    lastActionMessage: null,
  }));

  // Form inputs
  const [form, setForm] = useState<FormData>({
    boardName: "",
    boardPurpose: "",
    taskTitle: "",
    additionalTasks: [],
    newTaskInput: "",
    inviteEmail: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading state
  if (!toolOutput) {
    return (
      <div className="p-6 text-center text-secondary">
        Loading Ciello...
      </div>
    );
  }

  // Error state
  if (toolOutput.error) {
    return (
      <div className="bg-surface min-h-screen p-6">
        <div className="max-w-md mx-auto text-center">
          <Badge color="danger">Error</Badge>
          <p className="mt-4 text-secondary">{toolOutput.error.message}</p>
          <p className="mt-2 text-sm text-tertiary">{toolOutput.error.suggestion}</p>
        </div>
      </div>
    );
  }

  const config = STEP_CONFIG[state.step];
  const stepNumber = config.number;
  const totalSteps = 4;
  const progress = (stepNumber / totalSteps) * 100;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAddTaskToList = () => {
    if (form.newTaskInput.trim()) {
      setForm(prev => ({
        ...prev,
        additionalTasks: [...prev.additionalTasks, prev.newTaskInput.trim()],
        newTaskInput: "",
      }));
    }
  };

  const handleRemoveTask = (index: number) => {
    setForm(prev => ({
      ...prev,
      additionalTasks: prev.additionalTasks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      let params: Record<string, unknown> = {};
      
      // Build params based on current step
      switch (state.step) {
        case "started":
          params = {
            board_name: form.boardName.trim(),
            board_purpose: form.boardPurpose.trim(),
          };
          break;
        case "board_created":
          params = {
            task_title: form.taskTitle.trim() || undefined,
          };
          break;
        case "first_task":
          params = {
            additional_task_titles: form.additionalTasks.length > 0 ? form.additionalTasks : undefined,
            invite_email: form.inviteEmail.trim() || undefined,
          };
          break;
        case "expanded":
          params = {};
          break;
      }

      const response = await window.openai.callTool(config.tool, params);
      const data = response as unknown as { structuredContent: InitialToolOutput };
      const result = data.structuredContent;

      // Update state with response
      setState(prev => ({
        step: result.currentStep,
        board: result.board ?? prev.board,
        tasks: result.tasks ?? prev.tasks,
        invite: result.invite ?? prev.invite,
        lastActionMessage: result.message,
      }));

      // Reset form for next step
      setForm({
        boardName: "",
        boardPurpose: "",
        taskTitle: "",
        additionalTasks: [],
        newTaskInput: "",
        inviteEmail: "",
      });

    } catch (error) {
      console.error("Tool call failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = (): boolean => {
    switch (state.step) {
      case "started":
        return form.boardName.trim().length > 0 && form.boardPurpose.trim().length > 0;
      case "board_created":
        return form.taskTitle.trim().length > 0;
      case "first_task":
        return true; // Everything is optional
      case "expanded":
        return true; // No inputs needed
      default:
        return false;
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      {/* Main Content - Vertical Stack */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          {state.step === "complete" ? (
            <CompletionView state={state} />
          ) : (
            <div className="space-y-6">
              {/* Form Inputs */}
              <StepForm 
                step={state.step}
                form={form}
                setForm={setForm}
                onAddTask={handleAddTaskToList}
                onRemoveTask={handleRemoveTask}
                disabled={isSubmitting}
                progress={progress}
              />

              {/* Board Preview */}
              <BoardPreview 
                board={state.board}
                tasks={state.tasks}
                invite={state.invite}
              />
            </div>
          )}
        </div>
      </div>

      {/* CTA Button - Bottom Right */}
      {state.step !== "complete" && (
        <div className="px-6 pb-6">
          <div className="max-w-2xl mx-auto flex justify-end">
            <Button
              color="primary"
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <LoadingIndicator size={16} />
              ) : (
                <>
                  {config.ctaLabel}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface StepFormProps {
  step: OnboardingStep;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  disabled: boolean;
  progress: number;
}

function StepForm({ step, form, setForm, onAddTask, onRemoveTask, disabled, progress }: StepFormProps) {
  const ProgressBar = () => (
    <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
      <div 
        className="h-full bg-success-solid rounded-full transition-all duration-300" 
        style={{ width: `${progress}%` }} 
      />
    </div>
  );

  switch (step) {
    case "started":
      return (
        <div className="bg-surface-secondary rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <Badge color="info">Step 1: Create Your Board</Badge>
            <ProgressBar />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Board Name
              </label>
              <Input
                type="text"
                placeholder="e.g., Marketing Launch, Product Roadmap"
                value={form.boardName}
                onChange={(e) => setForm(prev => ({ ...prev, boardName: e.target.value }))}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                What will you use this board for?
              </label>
              <Input
                type="text"
                placeholder="e.g., Track our Q1 marketing campaign tasks"
                value={form.boardPurpose}
                onChange={(e) => setForm(prev => ({ ...prev, boardPurpose: e.target.value }))}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      );

    case "board_created":
      return (
        <div className="bg-surface-secondary rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <Badge color="info">Step 2: Add Your First Task</Badge>
            <ProgressBar />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Task Title
            </label>
            <Input
              type="text"
              placeholder="Brainstorm with ChatGPT"
              value={form.taskTitle}
              onChange={(e) => setForm(prev => ({ ...prev, taskTitle: e.target.value }))}
              disabled={disabled}
            />
          </div>
        </div>
      );

    case "first_task":
      return (
        <div className="bg-surface-secondary rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <Badge color="info">Step 3: Expand Your Board</Badge>
            <ProgressBar />
          </div>
          
          {/* Add More Tasks */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-primary mb-2">
              Add More Tasks <span className="text-tertiary font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter a task title"
                value={form.newTaskInput}
                onChange={(e) => setForm(prev => ({ ...prev, newTaskInput: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && onAddTask()}
                disabled={disabled}
              />
              <Button
                color="secondary"
                onClick={onAddTask}
                disabled={!form.newTaskInput.trim() || disabled}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            
            {/* Task List */}
            {form.additionalTasks.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.additionalTasks.map((task, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-surface rounded-lg border border-default px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-primary truncate">{task}</span>
                    <button
                      onClick={() => onRemoveTask(index)}
                      className="text-tertiary hover:text-danger transition-colors"
                      disabled={disabled}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Invite Teammate */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              <Mail className="size-4 inline mr-1" />
              Invite a Teammate <span className="text-tertiary font-normal">(optional)</span>
            </label>
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={form.inviteEmail}
              onChange={(e) => setForm(prev => ({ ...prev, inviteEmail: e.target.value }))}
              disabled={disabled}
            />
          </div>
        </div>
      );

    case "expanded":
      return (
        <div className="bg-surface-secondary rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <Badge color="success">Step 4: Finish Setup</Badge>
            <ProgressBar />
          </div>
          <p className="text-secondary">
            Your board is ready! Click "Finish Setup" to complete the onboarding process.
          </p>
        </div>
      );

    default:
      return null;
  }
}

interface BoardPreviewProps {
  board: BoardData | null;
  tasks: TaskData[];
  invite: InviteData | null;
}

function BoardPreview({ board, tasks, invite }: BoardPreviewProps) {
  if (!board) {
    return (
      <div className="bg-surface-secondary rounded-xl p-5 flex items-center justify-center py-8">
        <div className="text-center">
          <Clipboard className="size-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary">Your board preview will appear here</p>
          <p className="text-xs text-tertiary mt-1">Fill out the form to create your board</p>
        </div>
      </div>
    );
  }

  const todoTasks = tasks.filter(t => t.status === "todo");
  const doingTasks = tasks.filter(t => t.status === "doing");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className="bg-surface rounded-xl border border-default shadow-lg p-5">
      {/* Board Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-subtle">
        <Clipboard className="size-5 text-primary" />
        <h3 className="font-semibold text-primary">{board.name}</h3>
      </div>
      
      {/* Task Columns */}
      {tasks.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {/* To Do Column */}
          <div className="bg-surface-secondary rounded-lg p-3">
            <span className="block text-xs font-medium text-secondary uppercase tracking-wide mb-3">To Do</span>
            <div className="space-y-2">
              {todoTasks.map(task => (
                <div key={task.id} className="bg-surface rounded-lg border border-default p-2 shadow-sm">
                  <p className="text-xs font-medium text-primary line-clamp-2">{task.title}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Doing Column */}
          <div className="bg-surface-secondary rounded-lg p-3">
            <span className="block text-xs font-medium text-secondary uppercase tracking-wide mb-3">Doing</span>
            <div className="space-y-2">
              {doingTasks.map(task => (
                <div key={task.id} className="bg-surface rounded-lg border border-default p-2 shadow-sm">
                  <p className="text-xs font-medium text-primary line-clamp-2">{task.title}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Done Column */}
          <div className="bg-surface-secondary rounded-lg p-3">
            <span className="block text-xs font-medium text-secondary uppercase tracking-wide mb-3">Done</span>
            <div className="space-y-2">
              {doneTasks.map(task => (
                <div key={task.id} className="bg-surface rounded-lg border border-default p-2 shadow-sm">
                  <p className="text-xs font-medium text-primary line-clamp-2">{task.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-secondary rounded-lg p-4 text-center">
          <p className="text-sm text-tertiary">No tasks yet</p>
        </div>
      )}

      {/* Invite Status */}
      {invite && (
        <div className="mt-4 pt-3 border-t border-subtle flex items-center gap-2">
          <Mail className="size-4 text-info" />
          <span className="text-sm text-secondary">{invite.email}</span>
        </div>
      )}
    </div>
  );
}

interface CompletionViewProps {
  state: OnboardingState;
}

function CompletionView({ state }: CompletionViewProps) {
  return (
    <div className="space-y-6">
      {/* Success Indicator */}
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-success-soft">
          <Check className="size-8 text-success" />
        </div>
      </div>

      {state.board && (
        <BoardPreview 
          board={state.board}
          tasks={state.tasks}
          invite={state.invite}
        />
      )}
    </div>
  );
}

// ============================================================================
// Mount
// ============================================================================

const root = createRoot(document.getElementById("root")!);
root.render(<CielloOnboarding />);

