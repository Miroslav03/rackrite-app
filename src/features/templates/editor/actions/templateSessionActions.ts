import {
  templateRepository,
  type TemplateRepository,
} from "@/data/repositories/templateRepository";

import type { Exercise } from "@/domain/exercises/exercise.types";
import { DEFAULT_REST_SECONDS_BY_EXERCISE_KIND } from "@/domain/settings/settings.constants";
import type {
  Template,
  TemplateAggregate,
  TemplateExerciseId,
  TemplateId,
  TemplateSetId,
  TemplateSetValues,
} from "@/domain/templates/editor/templates.types";
import {
  addTemplateExercise,
  addTemplateSet,
  createEmptyTemplate,
  removeTemplateExercise,
  removeTemplateSet,
  updateTemplateExerciseOrder,
  updateTemplateSet,
  updateTemplateMetadata,
} from "@/domain/templates/editor/templates.useCases";

import { createId } from "@/shared/utils/id";

import { createTemplate } from "./createTemplate";
import { loadTemplate } from "./loadTemplate";
import { updateTemplate } from "./updateTemplate";

export type AddTemplateExerciseCommand = { exercise: Exercise };
export type RemoveTemplateExerciseCommand = {
  templateExerciseId: TemplateExerciseId;
};
export type AddTemplateSetCommand = {
  templateExerciseId: TemplateExerciseId;
};
export type UpdateTemplateExerciseOrderCommand = {
  templateExerciseId: TemplateExerciseId;
  orderIndex: number;
};

export type UpdateTemplateSetCommand = {
  templateSetId: TemplateSetId;
  values: Partial<TemplateSetValues>;
};
export type RemoveTemplateSetCommand = { templateSetId: TemplateSetId };

export type UpdateTemplateMetadataCommand = Partial<
  Pick<Template, "name" | "description">
>;

export type TemplateSessionActions = {
  updateMetadata: (
    template: TemplateAggregate,
    command: UpdateTemplateMetadataCommand,
  ) => TemplateAggregate;
  createEmptyTemplate: () => TemplateAggregate;
  createTemplate: (template: TemplateAggregate) => Promise<void>;
  loadTemplate: (templateId: TemplateId) => Promise<TemplateAggregate>;
  updateTemplate: (
    previous: TemplateAggregate,
    next: TemplateAggregate,
  ) => Promise<void>;
  removeExercise: (
    template: TemplateAggregate,
    command: RemoveTemplateExerciseCommand,
  ) => TemplateAggregate;
  addSet: (
    template: TemplateAggregate,
    command: AddTemplateSetCommand,
  ) => TemplateAggregate;
  updateExerciseOrder: (
    template: TemplateAggregate,
    command: UpdateTemplateExerciseOrderCommand,
  ) => TemplateAggregate;
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

export function createTemplateSessionActions(
  dependencies: {
    repository: Pick<
      TemplateRepository,
      | "insertTemplateAggregate"
      | "getTemplateAggregateById"
      | "updateTemplateAggregate"
    >;
    now: () => number;
    createTemplateId: () => TemplateId;
    createTemplateExerciseId: () => TemplateExerciseId;
    createTemplateSetId: () => TemplateSetId;
  },
): TemplateSessionActions {
  return {
    updateMetadata: (template, command) =>
      updateTemplateMetadata(template, { ...command, now: dependencies.now() }),
    createTemplate: (template) => createTemplate(dependencies, template),
    loadTemplate: (templateId) => loadTemplate(dependencies, templateId),
    updateTemplate: (previous, next) =>
      updateTemplate(dependencies, previous, next),
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
    removeExercise: (template, command) =>
      removeTemplateExercise(template, { ...command, now: dependencies.now() }),
    addSet: (template, command) =>
      addTemplateSet(template, {
        ...command,
        setId: dependencies.createTemplateSetId(),
        reps: 5,
        now: dependencies.now(),
      }),
    updateExerciseOrder: (template, command) =>
      updateTemplateExerciseOrder(template, {
        ...command,
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
  repository: templateRepository,
  now: Date.now,
  createTemplateId: () => createId("template"),
  createTemplateExerciseId: () => createId("template_exercise"),
  createTemplateSetId: () => createId("template_set"),
});
