import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";

import { HistoryErrorNotice } from "./components/HistoryErrorNotice";

export function HistoryScreenLoadError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <Screen scroll={false}>
      <ScreenHeader title="History" subtitle="Logbook" />
      <HistoryErrorNotice
        message="Couldn't load your workout history."
        error={error}
        onRetry={onRetry}
      />
    </Screen>
  );
}
