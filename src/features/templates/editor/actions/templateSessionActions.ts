import type { Exercise } from "@/domain/exercises/exercise.types";
import { DEFAULT_REST_SECONDS_BY_EXERCISE_KIND } from "@/domain/settings/settings.constants";
import type {
  TemplateAggregate,
  TemplateExerciseId,
  TemplateId,
  TemplateSetId,
  TemplateSetValues,
} from "@/domain/templates/editor/templates.types";
import {
  addTemplateExercise,
  createEmptyTemplate,
  removeTemplateSet,
  updateTemplateSet,
} from "@/domain/templates/editor/templates.useCases";
import { createId } from "@/shared/utils/id";

export type AddTemplateExerciseCommand = { exercise: Exercise };

export type UpdateTemplateSetCommand = {
  templateSetId: TemplateSetId;
  values: Partial<TemplateSetValues>;
};
export type RemoveTemplateSetCommand = { templateSetId: TemplateSetId };

export type TemplateSessionActions = {
  createEmptyTemplate: () => TemplateAggregate;
  addExercise: (
    template: TemplateAggregate,
    command: AddTemplateExerciseCommand,
  ) => TemplateAggregate;
  updateSet: (
    template: TemplateAggregate,
    command: UpdateTemplateSetCommand,
  ) => TemplateAggregate;
  removeSet: (
    template: TemplateAggregate,
    command: RemoveTemplateSetCommand,
  ) => TemplateAggregate;
};

export function createTemplateSessionActions(dependencies: {
  now: () => number;
  createTemplateId: () => TemplateId;
  createTemplateExerciseId: () => TemplateExerciseId;
  createTemplateSetId: () => TemplateSetId;
}): TemplateSessionActions {
  return {
    createEmptyTemplate: () =>
      createEmptyTemplate({
        id: dependencies.createTemplateId(),
        now: dependencies.now(),
      }),
    addExercise: (template, { exercise }) =>
      addTemplateExercise(template, {
        exercise,
        templateExerciseId: dependencies.createTemplateExerciseId(),
        setId: dependencies.createTemplateSetId(),
        reps: 5,
        restSeconds:
          exercise.defaultRestSeconds ??
          DEFAULT_REST_SECONDS_BY_EXERCISE_KIND[exercise.kind],
        now: dependencies.now(),
      }),
    updateSet: (template, { templateSetId, values }) =>
      updateTemplateSet(template, {
        ...values,
        setId: templateSetId,
        now: dependencies.now(),
      }),
    removeSet: (template, { templateSetId }) =>
      removeTemplateSet(template, {
        setId: templateSetId,
        now: dependencies.now(),
      }),
  };
}

export const templateSessionActions = createTemplateSessionActions({
  now: Date.now,
  createTemplateId: () => createId("template"),
  createTemplateExerciseId: () => createId("template_exercise"),
  createTemplateSetId: () => createId("template_set"),
});
