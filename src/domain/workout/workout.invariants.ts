import { LiftFamily } from "../domain.types";
import { WorkoutAggregate } from "./workout.types";

// Depending on buisness rules this can change later if we start editing workouts in history
export function assertWorkoutIsEditable(
  workoutAggregate: WorkoutAggregate,
): void {
  if (workoutAggregate.workout.status === "completed") {
    throw new Error("Completed workout cannot be edited");
  }
}

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

export function assertWorkoutCanAddSection(
  workoutAggregate: WorkoutAggregate,
  liftFamily: LiftFamily,
): void {
  if (workoutAggregate.sections.length >= 3) {
    throw new Error("Workout cannot have more than 3 sections");
  }

  const alreadyHasLiftFamily = workoutAggregate.sections.some(
    (workoutSectionAggregate) =>
      workoutSectionAggregate.section.liftFamily === liftFamily,
  );

  if (alreadyHasLiftFamily) {
    throw new Error(`Workout already has a ${liftFamily} section`);
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

export function assertWorkoutAggregateInvariants(
  workoutAggregate: WorkoutAggregate,
): void {
  assertMaxThreeSections(workoutAggregate);
  assertUniqueLiftFamilies(workoutAggregate);
  assertActiveSetExistsIfWorkoutHasSets(workoutAggregate);
  assertFinishedSetsHaveWeightAndReps(workoutAggregate);
}
