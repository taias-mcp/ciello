import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Warning } from '@openai/apps-sdk-ui/components/Icon';
import type { ToolError } from '../../types/outputs';

interface ErrorCalloutProps {
  error: ToolError;
}

export function ErrorCallout({ error }: ErrorCalloutProps) {
  return (
    <div className="rounded-2xl border border-danger-outline bg-danger-soft p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-danger">
          <Warning className="size-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge color="danger">{error.code}</Badge>
          </div>
          <p className="mt-1 text-sm text-primary">{error.message}</p>
          {error.suggestion && (
            <p className="mt-2 text-sm text-secondary">
              <span className="font-medium">Suggestion:</span> {error.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
