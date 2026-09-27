import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { Screen } from "@/shared/components/layout/Screen";

import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";

export function TemplatesScreenLoadError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <Screen scroll={false}>
      <ScreenHeader title="Templates" subtitle="Library" />
      <ErrorNotice
        message="Couldn't load your templates."
        error={error}
        onRetry={onRetry}
      />
    </Screen>
  );
}
