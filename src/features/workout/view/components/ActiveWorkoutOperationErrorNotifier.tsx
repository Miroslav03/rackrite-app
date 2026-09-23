import { useEffect } from "react";

import { useToast } from "@/shared/components/feedback/ToastContext";

import type {
  ActiveWorkoutOperation,
  OperationState,
  StartWorkoutOperation,
} from "../../session/workoutSession.types";

type ActiveWorkoutOperationErrorNotifierProps = {
  operation: OperationState<ActiveWorkoutOperation | StartWorkoutOperation>;
  isFocused: boolean;
  onErrorDismissed: (error: Error) => void;
};

export function ActiveWorkoutOperationErrorNotifier({
  operation,
  isFocused,
  onErrorDismissed,
}: ActiveWorkoutOperationErrorNotifierProps) {
  const { hideToast, showToast } = useToast();

  useEffect(() => {
    if (!isFocused || operation.status !== "error") {
      return;
    }

    const currentError = operation.error;
    const toastId = showToast({
      message: getOperationErrorMessage(operation.operation),
      onDismiss: () => onErrorDismissed(currentError),
    });

    return () => {
      hideToast(toastId);
    };
  }, [hideToast, isFocused, onErrorDismissed, operation, showToast]);

  return null;
}

function getOperationErrorMessage(
  operation: ActiveWorkoutOperation | StartWorkoutOperation,
): string {
  if (typeof operation === "string") {
    switch (operation) {
      case "startEmptyWorkout":
        return "Couldn't start workout. Try again.";
      case "startWorkoutFromTemplate":
        return "Couldn't start workout from template. Try again.";
    }
  }

  switch (operation.type) {
    case "repeatWorkout":
      return "Couldn't repeat workout. Try again.";

    case "addExercise":
      return "Couldn't add exercise. Try again.";

    case "removeExercise":
      return "Couldn't remove exercise. Try again.";

    case "updateExerciseOrder":
      return "Couldn't update exercise order. Try again.";

    case "removeSet":
      return "Couldn't remove set. Try again.";

    case "addSet":
      return "Couldn't add set. Try again.";

    case "copyPreviousSet":
      return "Couldn't copy previous set. Try again.";

    case "updateSet":
      return "Couldn't update set. Try again.";

    case "completeSet":
      return "Couldn't complete set. Try again.";

    case "adjustRestTimer":
      return "Couldn't adjust rest timer. Try again.";

    case "resetRestTimer":
      return "Couldn't reset rest timer. Try again.";

    case "skipRestTimer":
      return "Couldn't skip rest timer. Try again.";

    case "undoCompletedSet":
      return "Couldn't undo set completion. Try again.";

    case "selectSet":
      return "Couldn't select set. Try again.";

    case "cancelWorkout":
      return "Couldn't cancel workout. Try again.";

    case "finishWorkout":
      return "Couldn't finish workout. Try again.";
  }
}
