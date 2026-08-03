import type {
  WorkoutAggregate,
  WorkoutExerciseAggregate,
  WorkoutExerciseId,
  WorkoutSet,
  WorkoutSetId,
} from "./workout.types";

export function getAllWorkoutSets(
  workoutAggregate: WorkoutAggregate,
): WorkoutSet[] {
  return workoutAggregate.exercises.flatMap(
    (exerciseAggregate) => exerciseAggregate.sets,
  );
}

export function getWorkoutExerciseById(
  workoutAggregate: WorkoutAggregate,
  workoutExerciseId: WorkoutExerciseId,
): WorkoutExerciseAggregate | undefined {
  return workoutAggregate.exercises.find(
    (exerciseAggregate) =>
      exerciseAggregate.workoutExercise.id === workoutExerciseId,
  );
}

export function getWorkoutSetById(
  workoutAggregate: WorkoutAggregate,
  setId: WorkoutSetId,
): WorkoutSet | undefined {
  return getAllWorkoutSets(workoutAggregate).find((set) => set.id === setId);
}

export function getWorkoutExerciseBySetId(
  workoutAggregate: WorkoutAggregate,
  setId: WorkoutSetId,
): WorkoutExerciseAggregate | undefined {
  return workoutAggregate.exercises.find((exerciseAggregate) =>
    exerciseAggregate.sets.some((set) => set.id === setId),
  );
}

export function getActiveWorkoutSet(
  workoutAggregate: WorkoutAggregate,
): WorkoutSet | undefined {
  const activeSetId = workoutAggregate.workout.activeSetId;

  return activeSetId === null
    ? undefined
    : getWorkoutSetById(workoutAggregate, activeSetId);
}

export function getActiveWorkoutExercise(
  workoutAggregate: WorkoutAggregate,
): WorkoutExerciseAggregate | undefined {
  const activeSet = getActiveWorkoutSet(workoutAggregate);

  if (!activeSet) {
    return undefined;
  }

  return getWorkoutExerciseBySetId(workoutAggregate, activeSet.id);
}

export function getActiveWorkoutSetIndex(
  workoutAggregate: WorkoutAggregate,
): number | undefined {
  const activeSetId = workoutAggregate.workout.activeSetId;

  if (activeSetId === null) {
    return undefined;
  }

  const activeSetIndex = getAllWorkoutSets(workoutAggregate).findIndex(
    (set) => set.id === activeSetId,
  );

  return activeSetIndex === -1 ? undefined : activeSetIndex;
}
