import { createRoot } from "react-dom/client";
import { useOpenAiGlobal } from "../../hooks/use-openai-global";
import "../../styles/index.css";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Check, ArrowRight, Clipboard, Mail, Members } from "@openai/apps-sdk-ui/components/Icon";

interface ExpandBoardOutput {
  message: string;
  currentStep: string;
  board: {
    id: string;
    name: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  invite?: {
    email: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
    suggestion: string;
  };
}

function ExpandWidget() {
  const toolOutput = useOpenAiGlobal("toolOutput") as ExpandBoardOutput | null;

  if (!toolOutput) {
    return (
      <div className="p-6 text-center text-secondary">
        Expanding board...
      </div>
    );
  }

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

  const { board, tasks, invite } = toolOutput;

  const handleFinish = async () => {
    await window.openai.callTool("finish_setup", {});
  };

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === "todo");
  const doingTasks = tasks.filter(t => t.status === "doing");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className="bg-surface min-h-screen">
      {/* Success Header */}
      <div className="bg-success-solid p-6 text-success-solid text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white/20">
          <Check className="size-6" />
        </div>
        <h2 className="text-xl font-bold">Board Expanded!</h2>
        <p className="opacity-90 mt-1">{tasks.length} task{tasks.length === 1 ? "" : "s"} ready</p>
      </div>

      {/* Board Preview */}
      <div className="p-6">
        <div className="bg-surface rounded-xl border border-default shadow-lg p-5 mb-6">
          {/* Board Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-subtle">
            <div className="flex items-center gap-2">
              <Clipboard className="size-5 text-primary" />
              <h3 className="font-semibold text-primary">{board.name}</h3>
            </div>
            {invite && (
              <div className="flex items-center gap-1.5">
                <Members className="size-4 text-info" />
                <span className="text-xs text-info">1 invited</span>
              </div>
            )}
          </div>
          
          {/* Task Columns */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* To Do Column */}
            <div className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">To Do</span>
                <Badge color="secondary" className="text-xs">{todoTasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {todoTasks.map(task => (
                  <div key={task.id} className="bg-surface rounded-lg border border-default p-2 shadow-sm">
                    <p className="text-xs font-medium text-primary line-clamp-2">{task.title}</p>
                  </div>
                ))}
                {todoTasks.length === 0 && (
                  <p className="text-xs text-tertiary text-center py-2">No tasks</p>
                )}
              </div>
            </div>
            
            {/* Doing Column */}
            <div className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">Doing</span>
                <Badge color="warning" className="text-xs">{doingTasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {doingTasks.map(task => (
                  <div key={task.id} className="bg-surface rounded-lg border border-warning-outline p-2 shadow-sm">
                    <p className="text-xs font-medium text-primary line-clamp-2">{task.title}</p>
                  </div>
                ))}
                {doingTasks.length === 0 && (
                  <p className="text-xs text-tertiary text-center py-2">No tasks</p>
                )}
              </div>
            </div>
            
            {/* Done Column */}
            <div className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">Done</span>
                <Badge color="success" className="text-xs">{doneTasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {doneTasks.map(task => (
                  <div key={task.id} className="bg-surface rounded-lg border border-success-outline p-2 shadow-sm">
                    <p className="text-xs font-medium text-primary line-clamp-2">{task.title}</p>
                  </div>
                ))}
                {doneTasks.length === 0 && (
                  <p className="text-xs text-tertiary text-center py-2">No tasks</p>
                )}
              </div>
            </div>
          </div>

          {/* Invite Status */}
          {invite && (
            <div className="bg-info-surface rounded-lg p-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-info-soft">
                <Mail className="size-4 text-info" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">{invite.email}</p>
                <p className="text-xs text-secondary">Invitation {invite.status}</p>
              </div>
              <Badge color="info">{invite.status}</Badge>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-secondary">Onboarding Progress</span>
            <span className="font-medium text-primary">Almost done!</span>
          </div>
          <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div className="h-full bg-success-solid rounded-full" style={{ width: "90%" }} />
          </div>
        </div>

        {/* Next Step */}
        <div className="text-center">
          <p className="text-sm text-secondary mb-4">
            Your board is looking great! Ready to complete setup?
          </p>
          <Button color="primary" onClick={handleFinish}>
            Finish Setup
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<ExpandWidget />);

