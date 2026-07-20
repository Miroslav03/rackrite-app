import { getAllWorkoutSets } from "../workout.selectors";
import type { WorkoutAggregate } from "../workout.types";

export function assertFinishedSetsHaveWeightAndReps(
  workoutAggregate: WorkoutAggregate,
): void {
  for (const set of getAllWorkoutSets(workoutAggregate)) {
    if (set.finishedAt !== null && (set.weight === null || set.reps === null)) {
      throw new Error("Finished set must have weight and reps");
    }
  }
}

export function assertActiveSetExistsIfWorkoutHasSets(
  workoutAggregate: WorkoutAggregate,
): void {
  const allSets = getAllWorkoutSets(workoutAggregate);

  if (allSets.length === 0 && workoutAggregate.workout.activeSetId !== null) {
    throw new Error("Empty workout cannot have an active set");
  }

  if (allSets.length > 0 && workoutAggregate.workout.activeSetId === null) {
    throw new Error("Non-empty workout must have an active set");
  }

  if (
    workoutAggregate.workout.activeSetId !== null &&
    !allSets.some((set) => set.id === workoutAggregate.workout.activeSetId)
  ) {
    throw new Error("Active set must point to an existing set");
  }
}

export function assertWorkoutAggregateOwnership(
  workoutAggregate: WorkoutAggregate,
): void {
  for (const exerciseAggregate of workoutAggregate.exercises) {
    const { workoutExercise, exercise, sets } = exerciseAggregate;

    if (workoutExercise.workoutId !== workoutAggregate.workout.id) {
      throw new Error("Workout exercise must belong to the aggregate workout");
    }

    if (workoutExercise.exerciseId !== exercise.id) {
      throw new Error(
        "Workout exercise must reference its aggregate exercise definition",
      );
    }

    for (const set of sets) {
      if (set.workoutExerciseId !== workoutExercise.id) {
        throw new Error("Workout set must belong to its parent exercise");
      }
    }
  }
}

export function assertWorkoutSetIndexesAreValid(
  workoutAggregate: WorkoutAggregate,
): void {
  for (const exerciseAggregate of workoutAggregate.exercises) {
    exerciseAggregate.sets.forEach((set, index) => {
      if (set.setIndex !== index) {
        throw new Error("Workout set indexes must match their order");
      }
    });
  }
}

export function assertWorkoutSetValuesAreValid(
  workoutAggregate: WorkoutAggregate,
): void {
  for (const set of getAllWorkoutSets(workoutAggregate)) {
    if (set.weight !== null && set.weight < 0) {
      throw new Error("Weight cannot be a negative number");
    }

    if (set.reps !== null) {
      if (!Number.isInteger(set.reps)) {
        throw new Error("Reps must be a whole number");
      }

      if (set.reps <= 0) {
        throw new Error("Reps must be a positive number");
      }
    }

    if (set.rpe !== null) {
      if (!Number.isInteger(set.rpe)) {
        throw new Error("RPE must be a whole number");
      }

      if (set.rpe < 1 || set.rpe > 10) {
        throw new Error("RPE must be between 1 and 10");
      }
    }
  }
}

export function assertWorkoutAggregateInvariants(
  workoutAggregate: WorkoutAggregate,
): void {
  assertActiveSetExistsIfWorkoutHasSets(workoutAggregate);
  assertFinishedSetsHaveWeightAndReps(workoutAggregate);
  assertWorkoutAggregateOwnership(workoutAggregate);
  assertWorkoutSetIndexesAreValid(workoutAggregate);
  assertWorkoutSetValuesAreValid(workoutAggregate);
}
