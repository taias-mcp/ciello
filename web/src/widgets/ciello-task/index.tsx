import { createRoot } from "react-dom/client";
import { useOpenAiGlobal } from "../../hooks/use-openai-global";
import "../../styles/index.css";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Check, ArrowRight, Clipboard } from "@openai/apps-sdk-ui/components/Icon";

interface CreateFirstTaskOutput {
  message: string;
  currentStep: string;
  board: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
    suggestion: string;
  };
}

function TaskWidget() {
  const toolOutput = useOpenAiGlobal("toolOutput") as CreateFirstTaskOutput | null;

  if (!toolOutput) {
    return (
      <div className="p-6 text-center text-secondary">
        Adding task...
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

  const { board, task } = toolOutput;

  const handleExpand = async () => {
    await window.openai.callTool("expand_board", {});
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Success Header */}
      <div className="bg-success-solid p-6 text-success-solid text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white/20">
          <Check className="size-6" />
        </div>
        <h2 className="text-xl font-bold">Task Added!</h2>
      </div>

      {/* Board Preview */}
      <div className="p-6">
        <div className="bg-surface rounded-xl border border-default shadow-lg p-5 mb-6">
          {/* Board Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-subtle">
            <Clipboard className="size-5 text-primary" />
            <h3 className="font-semibold text-primary">{board.name}</h3>
          </div>
          
          {/* Task Columns Preview */}
          <div className="grid grid-cols-3 gap-3">
            {/* To Do Column */}
            <div className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">To Do</span>
                <Badge color="secondary" className="text-xs">1</Badge>
              </div>
              {/* Task Card */}
              <div className="bg-surface rounded-lg border border-default p-3 shadow-sm">
                <p className="text-sm font-medium text-primary line-clamp-2">{task.title}</p>
              </div>
            </div>
            
            {/* Doing Column */}
            <div className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">Doing</span>
                <Badge color="secondary" className="text-xs">0</Badge>
              </div>
              <div className="text-center py-4">
                <p className="text-xs text-tertiary">No tasks</p>
              </div>
            </div>
            
            {/* Done Column */}
            <div className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">Done</span>
                <Badge color="secondary" className="text-xs">0</Badge>
              </div>
              <div className="text-center py-4">
                <p className="text-xs text-tertiary">No tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-secondary">Onboarding Progress</span>
            <span className="font-medium text-primary">Step 3 of 4</span>
          </div>
          <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div className="h-full bg-success-solid rounded-full" style={{ width: "75%" }} />
          </div>
        </div>

        {/* Next Step */}
        <div className="text-center">
          <p className="text-sm text-secondary mb-4">
            Great start! Want to add more tasks or invite a teammate?
          </p>
          <Button color="primary" onClick={handleExpand}>
            Expand Your Board
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<TaskWidget />);

