import { WorkoutAggregate } from "../workout.types";

export function assertMaxThreeSections(
  workoutAggregate: WorkoutAggregate,
): void {
  if (workoutAggregate.sections.length > 3) {
    throw new Error("Workout cannot have more than 3 sections");
  }
}

export function assertUniqueLiftFamilies(
  workoutAggregate: WorkoutAggregate,
): void {
  const families = workoutAggregate.sections.map(
    (sectionAggregate) => sectionAggregate.section.liftFamily,
  );

  const uniqueFamilies = new Set(families);

  if (uniqueFamilies.size !== families.length) {
    throw new Error("Workout cannot have duplicate lift families");
  }
}

export function assertFinishedSetsHaveWeightAndReps(
  workoutAggregate: WorkoutAggregate,
): void {
  const allSets = workoutAggregate.sections.flatMap(
    (workoutSectionAggregate) => workoutSectionAggregate.sets,
  );

  for (const set of allSets) {
    if (set.finishedAt !== null && (set.weight === null || set.reps === null)) {
      throw new Error("Finished set must have weight and reps");
    }
  }
}

export function assertActiveSetExistsIfWorkoutHasSets(
  workoutAggregate: WorkoutAggregate,
): void {
  const allSets = workoutAggregate.sections.flatMap(
    (workoutSectionAggregate) => workoutSectionAggregate.sets,
  );

  if (allSets.length === 0 && workoutAggregate.workout.activeSetId !== null) {
    throw new Error("Empty workout cannot have an active set");
  }

  if (allSets.length > 0 && workoutAggregate.workout.activeSetId === null) {
    throw new Error("Non-empty workout must have an active set");
  }

  if (workoutAggregate.workout.activeSetId === null) {
    return;
  }

  const activeSetExists = allSets.some(
    (set) => set.id === workoutAggregate.workout.activeSetId,
  );

  if (!activeSetExists) {
    throw new Error("Active set must point to an existing set");
  }
}

export function assertWorkoutAggregateOwnership(
  workoutAggregate: WorkoutAggregate,
): void {
  for (const sectionAggregate of workoutAggregate.sections) {
    const { section, sets } = sectionAggregate;

    if (section.workoutId !== workoutAggregate.workout.id) {
      throw new Error("Workout section must belong to the aggregate workout");
    }

    for (const set of sets) {
      if (set.workoutSectionId !== section.id) {
        throw new Error("Workout set must belong to its parent section");
      }
    }
  }
}

export function assertWorkoutAggregateInvariants(
  workoutAggregate: WorkoutAggregate,
): void {
  assertMaxThreeSections(workoutAggregate);
  assertUniqueLiftFamilies(workoutAggregate);
  assertActiveSetExistsIfWorkoutHasSets(workoutAggregate);
  assertFinishedSetsHaveWeightAndReps(workoutAggregate);
  assertWorkoutAggregateOwnership(workoutAggregate);
}
