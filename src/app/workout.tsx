import { Redirect } from "expo-router";

import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";
import { ActiveWorkoutScreenView } from "@/features/workout/view/ActiveWorkoutScreenView";
import { WorkoutScreenLoadError } from "@/features/workout/view/WorkoutScreenLoadError";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";
import { ScrollVisibilityProvider } from "@/shared/context/ScrollVisibilityContext";

export default function WorkoutScreen() {
  const {
    state,
    cancelWorkout,
    finishWorkout,
    addExercise,
    removeExercise,
    updateExerciseOrder,
    removeSet,
    addSet,
    copyPreviousSet,
    updateSet,
    selectSet,
    completeSet,
    adjustRestTimer,
    resetRestTimer,
    skipRestTimer,
    undoCompletedSet,
    dismissOperationError,
  } = useWorkoutSession();

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
        <ScrollVisibilityProvider>
          <ActiveWorkoutScreenView
            workout={state.workout}
            operation={state.operation}
            actions={{
              cancelWorkout,
              finishWorkout,
              addExercise,
              removeExercise,
              updateExerciseOrder,
              removeSet,
              addSet,
              copyPreviousSet,
              updateSet,
              selectSet,
              completeSet,
              adjustRestTimer,
              resetRestTimer,
              skipRestTimer,
              undoCompletedSet,
              dismissOperationError,
            }}
          />
        </ScrollVisibilityProvider>
      );
  }
}
