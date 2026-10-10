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
  const isFocused = useIsFocused();
  const session = useWorkoutSession();

  const openActiveWorkout = useCallback(
    () => router.push("/workout"),
    [router],
  );

  const { state, refresh, selectLift } = useProgressController(
    progressActions,
    isFocused,
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
          isFocused={isFocused}
          state={state}
          onRefresh={refresh}
          onSelectLift={selectLift}
          onOpenActiveWorkout={
            session.state.status === "active" ? openActiveWorkout : undefined
          }
        />
      );
  }
}
