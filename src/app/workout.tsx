import { Redirect } from "expo-router";

import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";
import { ActiveWorkoutScreenView } from "@/features/workout/view/ActiveWorkoutScreenView";
import { WorkoutScreenLoadError } from "@/features/workout/view/WorkoutScreenLoadError";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export default function WorkoutScreen() {
  const { state, addExercise, removeExercise } = useWorkoutSession();

  switch (state.status) {
    case "loading":
      return (
        <FullScreenLoader
          accessibilityLabel="Loading active workout"
          testID="workout-screen-loading"
        />
      );

    case "loadError":
      return <WorkoutScreenLoadError error={state.error} />;

    case "noActiveWorkout":
      return <Redirect href="/" />;

    case "active":
      return (
        <ActiveWorkoutScreenView
          workout={state.workout}
          operation={state.operation}
          actions={{
            addExercise,
            removeExercise,
          }}
        />
      );
  }
}
