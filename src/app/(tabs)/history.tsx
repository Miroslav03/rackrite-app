import { useIsFocused, useRouter } from "expo-router";

import { historyActions } from "@/features/history/actions/historyActions";
import { useHistoryController } from "@/features/history/controller/useHistoryController";
import { HistoryScreenLoadError } from "@/features/history/view/HistoryScreenLoadError";
import { HistoryScreenView } from "@/features/history/view/HistoryScreenView";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export default function HistoryScreen() {
  const router = useRouter();
  const { state, dateReference, refresh, loadNextPage, retryNextPage } =
    useHistoryController(historyActions, useIsFocused());

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
          dateReference={dateReference}
          onRefresh={refresh}
          onLoadNextPage={loadNextPage}
          onRetryNextPage={retryNextPage}
          onOpenStart={() => router.navigate("/")}
        />
      );
  }
}
