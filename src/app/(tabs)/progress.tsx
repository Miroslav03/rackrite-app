import { useIsFocused } from "expo-router";

import { progressActions } from "@/features/progress/actions/progressActions";
import { useProgressController } from "@/features/progress/controller/useProgressController";
import { ProgressScreenLoadError } from "@/features/progress/view/ProgressScreenLoadError";
import { ProgressScreenView } from "@/features/progress/view/ProgressScreenView";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export default function ProgressScreen() {
  const { state, refresh, selectLift, selectMetric } = useProgressController(
    progressActions,
    useIsFocused(),
  );

  switch (state.status) {
    case "loading":
      return (
        <FullScreenLoader
          accessibilityLabel="Loading lift analysis"
          testID="progress-screen-loading"
        />
      );
    case "loadError":
      return <ProgressScreenLoadError error={state.error} onRetry={refresh} />;
    case "ready":
      return (
        <ProgressScreenView
          state={state}
          onRefresh={refresh}
          onSelectLift={selectLift}
          onSelectMetric={selectMetric}
        />
      );
  }
}
