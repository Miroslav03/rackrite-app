import {
  getWorkoutExerciseById,
  getWorkoutSetById,
} from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import type { ExercisePickerSelectionOperation } from "@/features/exercises/view/components/ExercisePickerSheet";

import type { DangerModalOperation } from "@/shared/components/ui/DangerModal";

import { isOperationPending } from "../session/workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "../session/workoutSession.types";

import type {
  ActiveWorkoutOverlay,
  DangerConfirmationModal,
} from "./ActiveWorkoutScreenView";
import type { ActiveSetEditorPanel } from "./components/ActiveWorkoutDock/activeWorkoutDock.types";

export function getDangerConfirmationContent(
  workout: WorkoutAggregate,
  confirmation: DangerConfirmationModal,
) {
  switch (confirmation.action) {
    case "cancelWorkout":
      return {
        title: "CANCEL WORKOUT?",
        description:
          "This workout and all logged exercises and sets will be permanently deleted. This action cannot be undone.",
        confirmLabel: "CANCEL",
        pendingLabel: "CANCELING...",
      };

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

export function isRemoveSetConfirmation(
  overlay: ActiveWorkoutOverlay,
  workoutSetId: WorkoutSetId,
): overlay is Extract<
  ActiveWorkoutOverlay,
  { type: "dangerConfirmationModal" }
> {
  return (
    overlay.type === "dangerConfirmationModal" &&
    overlay.confirmation.action === "removeSet" &&
    overlay.confirmation.workoutSetId === workoutSetId
  );
}

export function getAddExerciseOperation(
  overlay: ActiveWorkoutOverlay,
  operation: OperationState<ActiveWorkoutOperation>,
): ExercisePickerSelectionOperation {
  if (overlay.type !== "exercisePicker") {
    return { status: "idle" };
  }

  if (
    isOperationPending(operation) &&
    operation.operation.type === "addExercise"
  ) {
    return { status: "pending", label: "Adding exercise..." };
  }

  return { status: "idle" };
}

export function getDangerOperation(
  overlay: ActiveWorkoutOverlay,
  operation: OperationState<ActiveWorkoutOperation>,
): DangerModalOperation {
  if (overlay.type !== "dangerConfirmationModal") {
    return { status: "idle" };
  }

  if (!isOperationPending(operation)) {
    return { status: "idle" };
  }

  switch (overlay.confirmation.action) {
    case "cancelWorkout":
      return operation.operation.type === "cancelWorkout"
        ? { status: "pending", label: "CANCELING..." }
        : { status: "idle" };

    case "removeExercise":
      return operation.operation.type === "removeExercise" &&
        operation.operation.workoutExerciseId ===
          overlay.confirmation.workoutExerciseId
        ? { status: "pending", label: "REMOVING..." }
        : { status: "idle" };

    case "removeSet":
      return operation.operation.type === "removeSet" &&
        operation.operation.workoutSetId === overlay.confirmation.workoutSetId
        ? { status: "pending", label: "REMOVING..." }
        : { status: "idle" };
  }
}

export function getPanelLabel(panel: ActiveSetEditorPanel): string {
  switch (panel.type) {
    case "weight":
    case "weightKeypad":
      return "Weight";

    case "repsKeypad":
      return "Reps";

    case "rpe":
      return "RPE";

    case "setType":
      return "Set Type";
  }
}
