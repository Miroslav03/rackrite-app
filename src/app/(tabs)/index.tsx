import { useRouter } from "expo-router";

import { ActiveWorkoutView } from "@/features/start/view/ActiveWorkoutView";
import { NoActiveWorkoutView } from "@/features/start/view/NoActiveWorkoutView";
import { StartScreenLoadError } from "@/features/start/view/StartScreenLoadError";
import { getStartScreenViewState } from "@/features/start/view/startScreen.viewState";
import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export default function StartScreen() {
  const router = useRouter();
  const { state, startEmptyWorkout } = useWorkoutSession();

  const viewState = getStartScreenViewState(state);

  async function handleQuickStart() {
    const result = await startEmptyWorkout();

    if (!result.success) {
      return;
    }

    router.push("/workout");
  }

  switch (viewState.view) {
    case "loading":
      return (
        <FullScreenLoader
          accessibilityLabel="Loading active workout"
          testID="start-screen-loading"
        />
      );

    case "loadError":
      return <StartScreenLoadError error={viewState.error} />;

    case "noActiveWorkout":
      return (
        <NoActiveWorkoutView
          onStartEmptyWorkout={handleQuickStart}
          onStartFromTemplate={() => router.push("/templates")}
          startEmptyWorkout={viewState.startEmptyWorkout}
        />
      );

    case "activeWorkout":
      return (
        <ActiveWorkoutView
          onOpenWorkout={() => router.push("/workout")}
          workout={viewState.workout}
        />
      );
  }
}
