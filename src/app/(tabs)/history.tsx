import { useIsFocused } from "expo-router";

import { historyActions } from "@/features/history/actions/historyActions";
import { useHistoryController } from "@/features/history/controller/useHistoryController";
import { HistoryScreenLoadError } from "@/features/history/view/HistoryScreenLoadError";
import { HistoryScreenView } from "@/features/history/view/HistoryScreenView";
import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export default function HistoryScreen() {
  const isFocused = useIsFocused();
  const session = useWorkoutSession();

  const { state, dateReference, refresh, loadNextPage, retryNextPage } =
    useHistoryController(historyActions, isFocused);

  switch (state.status) {
    case "loading":
      return (
        <FullScreenLoader
          accessibilityLabel="Loading workout history"
          testID="history-screen-loading"
        />
      );
    case "loadError":
      return <HistoryScreenLoadError error={state.error} onRetry={refresh} />;
    case "ready":
      return (
        <HistoryScreenView
          state={state}
          session={session}
          dateReference={dateReference}
          onRefresh={refresh}
          onLoadNextPage={loadNextPage}
          onRetryNextPage={retryNextPage}
        />
      );
  }
}
