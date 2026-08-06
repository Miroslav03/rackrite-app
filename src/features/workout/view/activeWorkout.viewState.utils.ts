import {
    getWorkoutExerciseById,
    getWorkoutSetById,
} from "@/domain/workout/workout.selectors";
import {
    WorkoutAggregate,
    WorkoutExerciseId,
} from "@/domain/workout/workout.types";

import { ExercisePickerSelectionOperation } from "@/features/exercises/view/components/ExercisePickerSheet";

import { DangerModalOperation } from "@/shared/components/ui/DangerModal";

import {
    ActiveWorkoutOperation,
    OperationState,
} from "../session/workoutSession.types";

import {
    ActiveWorkoutOverlay,
    DangerConfirmationModal,
} from "./ActiveWorkoutScreenView";

export function getDangerConfirmationContent(
  workout: WorkoutAggregate,
  confirmation: DangerConfirmationModal,
) {
  switch (confirmation.action) {
    case "removeExercise": {
      const exercise = getWorkoutExerciseById(
        workout,
        confirmation.workoutExerciseId,
      );

      return exercise
        ? {
            title: "REMOVE EXERCISE?",
            description: `${exercise.exercise.name} and all of its sets will be permanently removed. This action cannot be undone.`,
            confirmLabel: "REMOVE",
            pendingLabel: "REMOVING...",
          }
        : null;
    }

    case "removeSet":
      return getWorkoutSetById(workout, confirmation.workoutSetId)
        ? {
            title: "REMOVE SET?",
            description:
              "This set will be permanently removed. This action cannot be undone.",
            confirmLabel: "REMOVE",
            pendingLabel: "REMOVING...",
          }
        : null;
  }
}

export function isRemoveExerciseConfirmation(
  overlay: ActiveWorkoutOverlay,
  workoutExerciseId: WorkoutExerciseId,
): overlay is Extract<
  ActiveWorkoutOverlay,
  { type: "dangerConfirmationModal" }
> {
  return (
    overlay.type === "dangerConfirmationModal" &&
    overlay.confirmation.action === "removeExercise" &&
    overlay.confirmation.workoutExerciseId === workoutExerciseId
  );
}

export function getAddExerciseOperation(
  overlay: ActiveWorkoutOverlay,
  operation: OperationState<ActiveWorkoutOperation>,
): ExercisePickerSelectionOperation {
  if (overlay.type !== "exercisePicker") {
    return { status: "idle" };
  }

  if (operation.status === "pending" && operation.operation === "addExercise") {
    return { status: "pending", label: "Adding exercise..." };
  }

  return overlay.error
    ? { status: "error", message: overlay.error.message }
    : { status: "idle" };
}

export function getDangerOperation(
  overlay: ActiveWorkoutOverlay,
  operation: OperationState<ActiveWorkoutOperation>,
): DangerModalOperation {
  if (overlay.type !== "dangerConfirmationModal") {
    return { status: "idle" };
  }

  if (
    overlay.confirmation.action === "removeExercise" &&
    operation.status === "pending" &&
    operation.operation === "removeExercise"
  ) {
    return { status: "pending", label: "REMOVING..." };
  }

  return overlay.error
    ? { status: "error", message: overlay.error.message }
    : { status: "idle" };
}
