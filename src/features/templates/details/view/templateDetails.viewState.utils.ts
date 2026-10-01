import type { TemplateDetails } from "@/domain/templates/details/templates.types";

import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";
import {
  ActiveWorkoutOperation,
  StartWorkoutOperation,
} from "@/features/workout/session/workoutSession.types";

import { DangerModalOperation } from "@/shared/components/ui/DangerModal";
import type { ExerciseDetails } from "@/shared/components/ui/ExerciseDetailsCard";
import {
  isOperationPending,
  OperationState,
} from "@/shared/state/operationState";
import { SET_TYPE_CONFIG } from "@/shared/theme/setTypes";
import { formatRelativeDay } from "@/shared/utils/formatRelativeDay";
import { formatRpe } from "@/shared/utils/formatRpe";

import { TemplateDetailsOverlay } from "./useTemplateDetailsScreenOverlay";

export function createTemplateDetailsViewModel(
  template: TemplateDetails,
  now: number,
) {
  return {
    name: template.name,
    description: template.description,
    lastPerformed: template.lastExecution
      ? formatRelativeDay(template.lastExecution.finishedAt, now)
      : "Never",
    totalSets: String(template.totalSets),
    averageRpe: formatRpe(template.averageRpe),
    exercises: template.exercises.map((exercise): ExerciseDetails => ({
      id: exercise.id,
      name: exercise.name,
      kind: formatExerciseKind(exercise.kind),
      sets: exercise.sets.map((set, index) => ({
        id: set.id,
        number: String(index + 1).padStart(2, "0"),
        type: SET_TYPE_CONFIG[set.type],
        reps: String(set.reps),
        rpe: formatRpe(set.rpe),
      })),
    })),
  };
}

export function getModalContent(overlay: TemplateDetailsOverlay) {
  switch (overlay.type) {
    case "dangerModal":
      switch (overlay.confirmation.action) {
        case "deleteTemplate":
          return {
            title: "DELETE TEMPLATE?",
            description: `Are you sure you want to delete this template? This action cannot be undone.`,
            confirmLabel: "REMOVE",
          };

        case "startWorkoutFromTemplate":
          return {
            title: "DISCARD CURRENT WORKOUT?",
            description:
              "Your current workout and all logged exercises and sets will be permanently deleted. The selected template will start as a new session.",
            confirmLabel: "DISCARD",
          };
      }

    default:
      return null;
  }
}

export function getModalOperation(
  overlay: TemplateDetailsOverlay,
  workoutOperation: OperationState<
    ActiveWorkoutOperation | StartWorkoutOperation
  >,
): DangerModalOperation {
  if (!isOperationPending(workoutOperation)) {
    return { status: "idle" };
  }

  switch (overlay.type) {
    case "dangerModal":
      switch (overlay.confirmation.action) {
        /*   case "deleteTemplate":
          return removePending
            ? { status: "pending", label: "REMOVING..." }
            : { status: "idle" }; */

        case "startWorkoutFromTemplate":
          return workoutOperation.operation.type === "startWorkoutFromTemplate"
            ? { status: "pending", label: "STARTING..." }
            : { status: "idle" };
      }

    default:
      return { status: "idle" };
  }
}
