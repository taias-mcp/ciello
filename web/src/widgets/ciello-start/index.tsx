import { createRoot } from "react-dom/client";
import { useOpenAiGlobal } from "../../hooks/use-openai-global";
import "../../styles/index.css";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Check, ArrowRight } from "@openai/apps-sdk-ui/components/Icon";

interface StartOnboardingOutput {
  message: string;
  currentStep: string;
  startedAt: string;
  error?: {
    code: string;
    message: string;
    suggestion: string;
  };
}

function StartWidget() {
  const toolOutput = useOpenAiGlobal("toolOutput") as StartOnboardingOutput | null;

  if (!toolOutput) {
    return (
      <div className="p-6 text-center text-secondary">
        Starting onboarding...
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

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="bg-primary-solid p-8 text-primary-solid text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white/20">
          <Check className="size-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Ciello!</h1>
        <p className="opacity-90">Let's set up your workspace</p>
      </div>

      {/* Content */}
      <div className="p-6 max-w-md mx-auto">
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success font-semibold text-sm">
              1
            </div>
            <div>
              <h3 className="font-medium text-primary">Create your board</h3>
              <p className="text-sm text-secondary">Give it a name and purpose</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-tertiary font-semibold text-sm">
              2
            </div>
            <div>
              <h3 className="font-medium text-secondary">Add your first task</h3>
              <p className="text-sm text-tertiary">Get started with something simple</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-tertiary font-semibold text-sm">
              3
            </div>
            <div>
              <h3 className="font-medium text-secondary">Expand your board</h3>
              <p className="text-sm text-tertiary">Add more tasks, invite teammates</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Badge color="success" className="mb-4">Ready to Start</Badge>
          <p className="text-sm text-secondary mb-6">
            Tell me what you'd like to name your board and what you'll use it for.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-info">
            <ArrowRight className="size-4" />
            <span>Ask me to set up your board</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<StartWidget />);

