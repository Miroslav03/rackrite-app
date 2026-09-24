import { assertTemplateAggregateInvariants } from "./assertions/templates.invariants";
import {
    TemplateAggregate,
    TemplateExerciseAggregate,
    TemplateSet,
} from "./templates.types";

export function normalizeOptionalText(text: string | null): string | null {
  return text?.trim() || null;
}

export function withTemplateExercises(
  aggregate: TemplateAggregate,
  exercises: TemplateExerciseAggregate[],
  now: number,
): TemplateAggregate {
  const next = {
    template: { ...aggregate.template, updatedAt: now },
    exercises,
  };

  assertTemplateAggregateInvariants(next);
  return next;
}

export function replaceTemplateExercise(
  aggregate: TemplateAggregate,
  updated: TemplateExerciseAggregate,
  now: number,
): TemplateAggregate {
  return withTemplateExercises(
    aggregate,
    aggregate.exercises.map((entry) =>
      entry.templateExercise.id === updated.templateExercise.id
        ? updated
        : entry,
    ),
    now,
  );
}

export function withExerciseSets(
  aggregate: TemplateAggregate,
  entry: TemplateExerciseAggregate,
  sets: TemplateSet[],
  now: number,
): TemplateAggregate {
  return replaceTemplateExercise(
    aggregate,
    {
      ...entry,
      templateExercise: { ...entry.templateExercise, updatedAt: now },
      sets,
    },
    now,
  );
}

export function reindexExercises(
  exercises: TemplateExerciseAggregate[],
  now: number,
): TemplateExerciseAggregate[] {
  return exercises.map((entry, orderIndex) =>
    entry.templateExercise.orderIndex === orderIndex
      ? entry
      : {
          ...entry,
          templateExercise: {
            ...entry.templateExercise,
            orderIndex,
            updatedAt: now,
          },
        },
  );
}

export function reindexSets(sets: TemplateSet[], now: number): TemplateSet[] {
  return sets.map((set, setIndex) =>
    set.setIndex === setIndex ? set : { ...set, setIndex, updatedAt: now },
  );
}
