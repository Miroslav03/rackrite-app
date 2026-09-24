import type { Exercise } from "@/domain/exercises/exercise.types";

import {
  assertTemplateExerciseExists,
  assertTemplateOrderIndexIsValid,
  assertTemplateSetExists,
} from "./assertions/templates.contracts";
import { assertTemplateAggregateInvariants } from "./assertions/templates.invariants";
import {
  getTemplateExerciseById,
  getTemplateExerciseBySetId,
} from "./templates.selectors";
import type {
  Template,
  TemplateAggregate,
  TemplateExercise,
  TemplateExerciseAggregate,
  TemplateExerciseId,
  TemplateId,
  TemplateSet,
  TemplateSetId,
  TemplateSetValues,
} from "./templates.types";
import {
  normalizeOptionalText,
  reindexExercises,
  reindexSets,
  replaceTemplateExercise,
  withExerciseSets,
  withTemplateExercises,
} from "./templates.utils";

type CreateEmptyTemplateInput = { id: TemplateId; now: number };

type UpdateTemplateMetadataInput = Partial<
  Pick<Template, "name" | "description">
> & { now: number };

type AddTemplateExerciseInput = Pick<TemplateSetValues, "reps"> &
  Partial<Pick<TemplateSetValues, "type" | "rpe">> & {
    templateExerciseId: TemplateExerciseId;
    setId: TemplateSetId;
    exercise: Exercise;
    restSeconds: number;
    now: number;
  };

type UpdateTemplateExerciseInput = Partial<
  Pick<TemplateExercise, "notes" | "restSeconds">
> & {
  templateExerciseId: TemplateExerciseId;
  exercise?: Exercise;
  now: number;
};

type RemoveTemplateExerciseInput = {
  templateExerciseId: TemplateExerciseId;
  now: number;
};

type UpdateTemplateExerciseOrderInput = RemoveTemplateExerciseInput & {
  orderIndex: number;
};

type AddTemplateSetInput = Pick<TemplateSetValues, "reps"> &
  Partial<Pick<TemplateSetValues, "type" | "rpe">> & {
    templateExerciseId: TemplateExerciseId;
    setId: TemplateSetId;
    now: number;
  };

type RemoveTemplateSetInput = { setId: TemplateSetId; now: number };

type UpdateTemplateSetInput = RemoveTemplateSetInput &
  Partial<TemplateSetValues>;

export function createEmptyTemplate({
  id,
  now,
}: CreateEmptyTemplateInput): TemplateAggregate {
  const aggregate: TemplateAggregate = {
    template: {
      id,
      name: "",
      description: null,
      createdAt: now,
      updatedAt: now,
    },
    exercises: [],
  };

  assertTemplateAggregateInvariants(aggregate);
  return aggregate;
}

export function updateTemplateMetadata(
  aggregate: TemplateAggregate,
  input: UpdateTemplateMetadataInput,
): TemplateAggregate {
  const next = {
    ...aggregate,
    template: {
      ...aggregate.template,
      name:
        input.name === undefined ? aggregate.template.name : input.name.trim(),
      description:
        input.description === undefined
          ? aggregate.template.description
          : normalizeOptionalText(input.description),
      updatedAt: input.now,
    },
  };

  assertTemplateAggregateInvariants(next);
  return next;
}

export function addTemplateExercise(
  aggregate: TemplateAggregate,
  input: AddTemplateExerciseInput,
): TemplateAggregate {
  const entry: TemplateExerciseAggregate = {
    templateExercise: {
      id: input.templateExerciseId,
      templateId: aggregate.template.id,
      exerciseId: input.exercise.id,
      notes: null,
      restSeconds: input.restSeconds,
      orderIndex: aggregate.exercises.length,
      createdAt: input.now,
      updatedAt: input.now,
    },
    exercise: { ...input.exercise },
    sets: [
      {
        id: input.setId,
        templateExerciseId: input.templateExerciseId,
        setIndex: 0,
        type: input.type ?? "working",
        reps: input.reps,
        rpe: input.rpe ?? null,
        createdAt: input.now,
        updatedAt: input.now,
      },
    ],
  };

  return withTemplateExercises(
    aggregate,
    [...aggregate.exercises, entry],
    input.now,
  );
}

export function updateTemplateExercise(
  aggregate: TemplateAggregate,
  input: UpdateTemplateExerciseInput,
): TemplateAggregate {
  const entry = getTemplateExerciseById(aggregate, input.templateExerciseId);

  assertTemplateExerciseExists(entry);

  const exercise =
    input.exercise === undefined ? entry.exercise : { ...input.exercise };

  return replaceTemplateExercise(
    aggregate,
    {
      ...entry,
      exercise,
      templateExercise: {
        ...entry.templateExercise,
        exerciseId: exercise.id,
        notes:
          input.notes === undefined
            ? entry.templateExercise.notes
            : normalizeOptionalText(input.notes),
        restSeconds: input.restSeconds ?? entry.templateExercise.restSeconds,
        updatedAt: input.now,
      },
    },
    input.now,
  );
}

export function removeTemplateExercise(
  aggregate: TemplateAggregate,
  input: RemoveTemplateExerciseInput,
): TemplateAggregate {
  assertTemplateExerciseExists(
    getTemplateExerciseById(aggregate, input.templateExerciseId),
  );

  const remaining = aggregate.exercises.filter(
    ({ templateExercise }) => templateExercise.id !== input.templateExerciseId,
  );

  return withTemplateExercises(
    aggregate,
    reindexExercises(remaining, input.now),
    input.now,
  );
}

export function updateTemplateExerciseOrder(
  aggregate: TemplateAggregate,
  input: UpdateTemplateExerciseOrderInput,
): TemplateAggregate {
  const entry = getTemplateExerciseById(aggregate, input.templateExerciseId);

  assertTemplateExerciseExists(entry);
  assertTemplateOrderIndexIsValid(input.orderIndex, aggregate.exercises.length);

  const previousIndex = aggregate.exercises.indexOf(entry);
  if (previousIndex === input.orderIndex) return aggregate;

  const exercises = [...aggregate.exercises];
  exercises.splice(previousIndex, 1);
  exercises.splice(input.orderIndex, 0, entry);

  return withTemplateExercises(
    aggregate,
    reindexExercises(exercises, input.now),
    input.now,
  );
}

export function addTemplateSet(
  aggregate: TemplateAggregate,
  input: AddTemplateSetInput,
): TemplateAggregate {
  const entry = getTemplateExerciseById(aggregate, input.templateExerciseId);

  assertTemplateExerciseExists(entry);

  const set: TemplateSet = {
    id: input.setId,
    templateExerciseId: input.templateExerciseId,
    setIndex: entry.sets.length,
    type: input.type ?? "working",
    reps: input.reps,
    rpe: input.rpe ?? null,
    createdAt: input.now,
    updatedAt: input.now,
  };

  return withExerciseSets(aggregate, entry, [...entry.sets, set], input.now);
}

export function updateTemplateSet(
  aggregate: TemplateAggregate,
  input: UpdateTemplateSetInput,
): TemplateAggregate {
  const entry = getTemplateExerciseBySetId(aggregate, input.setId);
  const set = entry?.sets.find(({ id }) => id === input.setId);

  assertTemplateSetExists(set);
  assertTemplateExerciseExists(entry);

  const nextSet: TemplateSet = {
    ...set,
    type: input.type ?? set.type,
    reps: input.reps ?? set.reps,
    rpe: input.rpe === undefined ? set.rpe : input.rpe,
    updatedAt: input.now,
  };

  return withExerciseSets(
    aggregate,
    entry,
    entry.sets.map((current) => (current.id === set.id ? nextSet : current)),
    input.now,
  );
}

export function removeTemplateSet(
  aggregate: TemplateAggregate,
  input: RemoveTemplateSetInput,
): TemplateAggregate {
  const entry = getTemplateExerciseBySetId(aggregate, input.setId);

  assertTemplateSetExists(entry?.sets.find(({ id }) => id === input.setId));
  assertTemplateExerciseExists(entry);

  const remaining = entry.sets.filter(({ id }) => id !== input.setId);

  if (remaining.length === 0) {
    return removeTemplateExercise(aggregate, {
      templateExerciseId: entry.templateExercise.id,
      now: input.now,
    });
  }

  return withExerciseSets(
    aggregate,
    entry,
    reindexSets(remaining, input.now),
    input.now,
  );
}
