import type { ExerciseKind } from "@/domain/exercises/exercise.types";
import { getTemplateExerciseBySetId } from "@/domain/templates/editor/templates.selectors";
import type { TemplateAggregate } from "@/domain/templates/editor/templates.types";

import type { ExercisePickerSelectionOperation } from "@/features/exercises/view/components/ExercisePickerSheet";

import type { DangerModalOperation } from "@/shared/components/ui/DangerModal";
import {
  isOperationPending,
  type OperationState,
} from "@/shared/state/operationState";

import type {
  CreateTemplateOperations,
  EditTemplateOperations,
} from "../session/templatesSession.types";

import type { TemplateEditorOverlay } from "./TemplateEditorScreen";

export function getModalContent(
  overlay: TemplateEditorOverlay,
  template: TemplateAggregate,
) {
  switch (overlay.type) {
    case "dangerModal":
      switch (overlay.confirmation.action) {
        case "discardTemplate":
          return {
            title: "DISCARD TEMPLATE?",
            description:
              "All unsaved changes to this template will be discarded. This action cannot be undone.",
            confirmLabel: "DISCARD",
          };

        case "removeSet": {
          const exercise = getTemplateExerciseBySetId(
            template,
            overlay.confirmation.templateSetId,
          );

          return exercise
            ? {
                title: "REMOVE SET?",
                description:
                  exercise.sets.length === 1
                    ? `This is the last set for ${exercise.exercise.name}. Removing it will also remove the exercise from this template.`
                    : "This set will be removed from the template. This action cannot be undone.",
                confirmLabel: "REMOVE",
              }
            : null;
        }
      }

    default:
      return null;
  }
}

export function getModalOperation(
  overlay: TemplateEditorOverlay,
  operation: OperationState<CreateTemplateOperations | EditTemplateOperations>,
): DangerModalOperation {
  if (!isOperationPending(operation)) {
    return { status: "idle" };
  }

  switch (overlay.type) {
    case "dangerModal":
      switch (overlay.confirmation.action) {
        case "discardTemplate":
          return operation.operation.type === "discardTemplate"
            ? { status: "pending", label: "DISCARDING..." }
            : { status: "idle" };

        case "removeSet":
          return operation.operation.type === "removeSet" &&
            operation.operation.templateSetId ===
              overlay.confirmation.templateSetId
            ? { status: "pending", label: "REMOVING..." }
            : { status: "idle" };
      }

    default:
      return { status: "idle" };
  }
}

//This should be reused later
export function getAddExerciseOperation(
  overlay: TemplateEditorOverlay,
  operation: OperationState<CreateTemplateOperations | EditTemplateOperations>,
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

//This should be reused later
export function getExercisePickerExclusions(template: TemplateAggregate) {
  const usedFamilies = new Set(
    template.exercises
      .filter(({ exercise }) => exercise.kind === "competition_lift")
      .map(({ exercise }) => exercise.liftFamily),
  );

  const excludedKinds: ExerciseKind[] =
    usedFamilies.size === 3 ? ["competition_lift"] : [];

  return {
    excludedExerciseIds: template.exercises.map(({ exercise }) => exercise.id),
    excludedKinds,
  };
}
