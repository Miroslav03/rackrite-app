import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";

export function ProgressScreenLoadError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <Screen scroll={false}>
      <ScreenHeader
        title="Progress"
        subtitle="Performance analytics and trends"
      />
      <ErrorNotice
        message="Couldn't load your lift analysis."
        error={error}
        onRetry={onRetry}
      />
    </Screen>
  );
}
