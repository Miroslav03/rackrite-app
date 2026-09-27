import type { LiftFamily, SetType } from "@/domain/domain.types";

import type { TemplateAggregate } from "../templates.types";

export function assertTemplateIdsAreUnique(
  templateAggregate: TemplateAggregate,
): void {
  const exerciseIds = new Set<string>();
  const setIds = new Set<string>();

  for (const { templateExercise, sets } of templateAggregate.exercises) {
    if (exerciseIds.has(templateExercise.id)) {
      throw new Error("Template exercise IDs must be unique");
    }
    exerciseIds.add(templateExercise.id);

    for (const set of sets) {
      if (setIds.has(set.id)) {
        throw new Error("Template set IDs must be unique");
      }
      setIds.add(set.id);
    }
  }
}

export function assertTemplateExerciseIndexesAreValid(
  templateAggregate: TemplateAggregate,
): void {
  templateAggregate.exercises.forEach(({ templateExercise }, index) => {
    if (templateExercise.orderIndex !== index) {
      throw new Error("Template exercise indexes must match their order");
    }
  });
}

export function assertTemplateSetIndexesAreValid(
  templateAggregate: TemplateAggregate,
): void {
  for (const { sets } of templateAggregate.exercises) {
    sets.forEach((set, index) => {
      if (set.setIndex !== index) {
        throw new Error("Template set indexes must match their order");
      }
    });
  }
}

export function assertTemplateExerciseRestSecondsAreValid(
  templateAggregate: TemplateAggregate,
): void {
  for (const { templateExercise } of templateAggregate.exercises) {
    if (
      !Number.isInteger(templateExercise.restSeconds) ||
      templateExercise.restSeconds <= 0
    ) {
      throw new Error(
        "Template exercise rest duration must be a positive integer",
      );
    }
  }
}

export function assertCompetitionLiftFamiliesAreUnique(
  templateAggregate: TemplateAggregate,
): void {
  const competitionLiftFamilies = new Set<LiftFamily>();

  for (const { exercise } of templateAggregate.exercises) {
    if (exercise.kind !== "competition_lift") {
      continue;
    }

    if (competitionLiftFamilies.has(exercise.liftFamily)) {
      throw new Error(
        `Template cannot contain more than one competition lift for the ${exercise.liftFamily} family`,
      );
    }

    competitionLiftFamilies.add(exercise.liftFamily);
  }
}

export function assertTemplateOwnership(
  templateAggregate: TemplateAggregate,
): void {
  for (const {
    templateExercise,
    exercise,
    sets,
  } of templateAggregate.exercises) {
    if (templateExercise.templateId !== templateAggregate.template.id) {
      throw new Error(
        "Template exercise must belong to the aggregate template",
      );
    }

    if (templateExercise.exerciseId !== exercise.id) {
      throw new Error(
        "Template exercise must reference its aggregate exercise definition",
      );
    }

    for (const set of sets) {
      if (set.templateExerciseId !== templateExercise.id) {
        throw new Error("Template set must belong to its parent exercise");
      }
    }
  }
}

export function assertTemplateSetsAreValid(aggregate: TemplateAggregate): void {
  const setTypes: ReadonlySet<SetType> = new Set([
    "warmup",
    "working",
    "top",
    "backoff",
  ]);

  for (const { sets } of aggregate.exercises) {
    if (sets.length === 0) {
      throw new Error("Template exercise must have at least one set");
    }

    for (const set of sets) {
      if (!setTypes.has(set.type)) {
        throw new Error("Template set type is invalid");
      }

      if (!Number.isInteger(set.reps) || set.reps <= 0) {
        throw new Error("Reps must be a positive whole number");
      }

      if (
        set.rpe !== null &&
        (!Number.isInteger(set.rpe) || set.rpe < 1 || set.rpe > 10)
      ) {
        throw new Error("RPE must be a whole number between 1 and 10");
      }
    }
  }
}

export function assertTemplateAggregateInvariants(
  templateAggregate: TemplateAggregate,
): void {
  assertTemplateIdsAreUnique(templateAggregate);
  assertCompetitionLiftFamiliesAreUnique(templateAggregate);
  assertTemplateOwnership(templateAggregate);
  assertTemplateExerciseIndexesAreValid(templateAggregate);
  assertTemplateSetIndexesAreValid(templateAggregate);
  assertTemplateExerciseRestSecondsAreValid(templateAggregate);
  assertTemplateSetsAreValid(templateAggregate);
}
