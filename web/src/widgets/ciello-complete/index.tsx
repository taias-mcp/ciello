import { createRoot } from "react-dom/client";
import { useOpenAiGlobal } from "../../hooks/use-openai-global";
import "../../styles/index.css";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Check, Clipboard, Members } from "@openai/apps-sdk-ui/components/Icon";

interface FinishSetupOutput {
  message: string;
  currentStep: string;
  completedAt: string;
  summary: {
    boardName: string;
    boardPurpose: string;
    taskCount: number;
    tasks: Array<{
      title: string;
      status: string;
    }>;
    invitedTeammate: string | null;
  };
  error?: {
    code: string;
    message: string;
    suggestion: string;
  };
}

function CompleteWidget() {
  const toolOutput = useOpenAiGlobal("toolOutput") as FinishSetupOutput | null;

  if (!toolOutput) {
    return (
      <div className="p-6 text-center text-secondary">
        Completing setup...
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

  const { summary } = toolOutput;

  return (
    <div className="bg-surface min-h-screen">
      {/* Celebration Header */}
      <div className="bg-gradient-to-br from-success-solid to-primary-solid p-8 text-success-solid text-center">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white/20">
          <Check className="size-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">You're All Set!</h1>
        <p className="opacity-90">Welcome to Ciello</p>
      </div>

      {/* Summary */}
      <div className="p-6">
        {/* Board Summary Card */}
        <div className="bg-surface rounded-xl border border-default shadow-lg p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-success-soft">
              <Clipboard className="size-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary text-lg">{summary.boardName}</h3>
              <p className="text-sm text-secondary">{summary.boardPurpose}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-subtle mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{summary.taskCount}</p>
              <p className="text-sm text-secondary">Task{summary.taskCount === 1 ? "" : "s"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{summary.invitedTeammate ? "1" : "0"}</p>
              <p className="text-sm text-secondary">Teammate{summary.invitedTeammate ? "" : "s"}</p>
            </div>
          </div>

          {/* Task List */}
          {summary.tasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-secondary mb-2">Your Tasks</h4>
              <div className="space-y-2">
                {summary.tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="flex size-5 items-center justify-center rounded bg-surface-secondary">
                      <Check className="size-3 text-tertiary" />
                    </div>
                    <span className="text-primary">{task.title}</span>
                    <Badge color="secondary" className="ml-auto text-xs">{task.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teammate */}
          {summary.invitedTeammate && (
            <div className="bg-info-surface rounded-lg p-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-info-soft">
                <Members className="size-4 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{summary.invitedTeammate}</p>
                <p className="text-xs text-secondary">Invitation sent</p>
              </div>
            </div>
          )}
        </div>

        {/* Completion Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-soft rounded-full">
            <Check className="size-5 text-success" />
            <span className="font-medium text-success">Onboarding Complete</span>
          </div>
          <p className="mt-4 text-sm text-secondary">
            Your board is ready to use. Start collaborating with your team!
          </p>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<CompleteWidget />);

