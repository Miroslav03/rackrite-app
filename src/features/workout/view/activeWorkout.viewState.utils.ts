import {
  getWorkoutExerciseById,
  getWorkoutFinishEligibility,
  getWorkoutSetById,
} from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import type { ExercisePickerSelectionOperation } from "@/features/exercises/view/components/ExercisePickerSheet";

import type { ConfirmationModalOperation } from "@/shared/components/ui/ConfirmationModal";
import type { DangerModalOperation } from "@/shared/components/ui/DangerModal";

import { isOperationPending } from "../session/workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "../session/workoutSession.types";

import type { ActiveWorkoutOverlay } from "./ActiveWorkoutScreenView";
import type { ActiveSetEditorPanel } from "./components/ActiveWorkoutDock/activeWorkoutDock.types";

export function isRemoveExerciseConfirmation(
  overlay: ActiveWorkoutOverlay,
  workoutExerciseId: WorkoutExerciseId,
): overlay is Extract<ActiveWorkoutOverlay, { type: "dangerModal" }> {
  return (
    overlay.type === "dangerModal" &&
    overlay.confirmation.action === "removeExercise" &&
    overlay.confirmation.workoutExerciseId === workoutExerciseId
  );
}

export function isRemoveSetConfirmation(
  overlay: ActiveWorkoutOverlay,
  workoutSetId: WorkoutSetId,
): overlay is Extract<ActiveWorkoutOverlay, { type: "dangerModal" }> {
  return (
    overlay.type === "dangerModal" &&
    overlay.confirmation.action === "removeSet" &&
    overlay.confirmation.workoutSetId === workoutSetId
  );
}

export function getModalContent(
  workout: WorkoutAggregate,
  overlay: ActiveWorkoutOverlay,
) {
  switch (overlay.type) {
    case "dangerModal":
      switch (overlay.confirmation.action) {
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
            overlay.confirmation.workoutExerciseId,
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
          return getWorkoutSetById(workout, overlay.confirmation.workoutSetId)
            ? {
                title: "REMOVE SET?",
                description:
                  "This set will be permanently removed. This action cannot be undone.",
                confirmLabel: "REMOVE",
                pendingLabel: "REMOVING...",
              }
            : null;
      }

    case "confirmationModal":
      switch (overlay.confirmation.action) {
        case "finishWorkout": {
          const eligibility = getWorkoutFinishEligibility(workout);

          switch (eligibility.status) {
            case "blocked":
              return null;
            case "eligible": {
              const unfinishedSets = eligibility.unfinishedSetCount;

              if (!unfinishedSets) {
                return {
                  title: "FINISH WORKOUT?",
                  description: "Are you sure you want to finish this workout?",
                  confirmLabel: "FINISH",
                  pendingLabel: "FINISHING...",
                };
              }

              return {
                title: "FINISH WORKOUT?",
                description: `You still have ${unfinishedSets} unfinished ${unfinishedSets === 1 ? "set" : "sets"}. Finish now to save completed sets and skip the rest.`,
                confirmLabel: "FINISH",
                pendingLabel: "FINISHING...",
              };
            }
          }
        }
      }

    default:
      return null;
  }
}

export function getAddExerciseOperation(
  overlay: ActiveWorkoutOverlay,
  operation: OperationState<ActiveWorkoutOperation>,
): ExercisePickerSelectionOperation {
  if (overlay.type !== "exercisePicker") {
    return { status: "idle" };
  }

  if (!isOperationPending(operation)) {
    return { status: "idle" };
  }

  if (operation.operation.type === "addExercise") {
    return { status: "pending", label: "Adding exercise..." };
  }

  return { status: "idle" };
}

export function getModalOperation(
  overlay: ActiveWorkoutOverlay,
  operation: OperationState<ActiveWorkoutOperation>,
): DangerModalOperation | ConfirmationModalOperation {
  if (!isOperationPending(operation)) {
    return { status: "idle" };
  }

  switch (overlay.type) {
    case "dangerModal":
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
            operation.operation.workoutSetId ===
              overlay.confirmation.workoutSetId
            ? { status: "pending", label: "REMOVING..." }
            : { status: "idle" };
      }
    case "confirmationModal":
      switch (overlay.confirmation.action) {
        case "finishWorkout":
          return operation.operation.type === "finishWorkout"
            ? { status: "pending", label: "FINISHING..." }
            : { status: "idle" };
      }
    default:
      return { status: "idle" };
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
