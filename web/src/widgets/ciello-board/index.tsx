import { createRoot } from "react-dom/client";
import { useOpenAiGlobal } from "../../hooks/use-openai-global";
import "../../styles/index.css";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Check, Plus, Clipboard } from "@openai/apps-sdk-ui/components/Icon";

interface SetupBoardOutput {
  message: string;
  currentStep: string;
  board: {
    id: string;
    name: string;
    purpose: string;
  };
  error?: {
    code: string;
    message: string;
    suggestion: string;
  };
}

function BoardWidget() {
  const toolOutput = useOpenAiGlobal("toolOutput") as SetupBoardOutput | null;

  if (!toolOutput) {
    return (
      <div className="p-6 text-center text-secondary">
        Creating board...
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

  const { board } = toolOutput;

  const handleAddTask = async () => {
    await window.openai.callTool("create_first_task", {});
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Success Header */}
      <div className="bg-success-solid p-6 text-success-solid text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white/20">
          <Check className="size-6" />
        </div>
        <h2 className="text-xl font-bold">Board Created!</h2>
      </div>

      {/* Board Card */}
      <div className="p-6">
        <div className="bg-surface rounded-xl border border-default shadow-lg p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
              <Clipboard className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-primary text-lg truncate">{board.name}</h3>
              <p className="text-sm text-secondary line-clamp-2">{board.purpose}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge color="info">0 tasks</Badge>
            <Badge color="secondary">No teammates yet</Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-secondary">Onboarding Progress</span>
            <span className="font-medium text-primary">Step 2 of 4</span>
          </div>
          <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div className="h-full bg-success-solid rounded-full" style={{ width: "50%" }} />
          </div>
        </div>

        {/* Next Step */}
        <div className="text-center">
          <p className="text-sm text-secondary mb-4">
            Your board is ready! Let's add your first task.
          </p>
          <Button color="primary" onClick={handleAddTask}>
            <Plus className="size-4" />
            Add Your First Task
          </Button>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<BoardWidget />);

