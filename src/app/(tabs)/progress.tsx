import { useIsFocused, useRouter } from "expo-router";
import { useCallback } from "react";

import { progressActions } from "@/features/progress/actions/progressActions";
import { useProgressController } from "@/features/progress/controller/useProgressController";
import { ProgressScreenLoadError } from "@/features/progress/view/ProgressScreenLoadError";
import { ProgressScreenView } from "@/features/progress/view/ProgressScreenView";
import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export default function ProgressScreen() {
  const router = useRouter();
  const session = useWorkoutSession();

  const openActiveWorkout = useCallback(
    () => router.push("/workout"),
    [router],
  );

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
          onOpenActiveWorkout={
            session.state.status === "active" ? openActiveWorkout : undefined
          }
        />
      );
  }
}
