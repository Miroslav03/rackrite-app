import type {
  WorkoutAggregate,
  WorkoutExerciseAggregate,
  WorkoutExerciseId,
  WorkoutRestTimer,
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

export function getActiveUnfinishedWorkoutSet(
  workout: WorkoutAggregate,
): WorkoutSet | undefined {
  const activeSet = getActiveWorkoutSet(workout);

  return activeSet?.finishedAt === null ? activeSet : undefined;
}

export function getNextUnfinishedWorkoutSetAfter(
  workoutAggregate: WorkoutAggregate,
  anchorSetId: WorkoutSetId,
  excludedSetIds: ReadonlySet<WorkoutSetId> = new Set(),
): WorkoutSet | undefined {
  const allSets = getAllWorkoutSets(workoutAggregate);
  const anchorSetIndex = allSets.findIndex((set) => set.id === anchorSetId);

  if (anchorSetIndex === -1) {
    return undefined;
  }

  const isEligible = (set: WorkoutSet) =>
    set.finishedAt === null && !excludedSetIds.has(set.id);

  return (
    allSets.slice(anchorSetIndex + 1).find(isEligible) ??
    allSets.slice(0, anchorSetIndex).find(isEligible)
  );
}

export function getNextActiveWorkoutSetIdAfter(
  workoutAggregate: WorkoutAggregate,
  anchorSetId: WorkoutSetId,
  excludedSetIds: ReadonlySet<WorkoutSetId> = new Set(),
): WorkoutSetId | null {
  const availableSets = getAllWorkoutSets(workoutAggregate).filter(
    ({ id }) => !excludedSetIds.has(id),
  );

  const nextUnfinishedSet = getNextUnfinishedWorkoutSetAfter(
    workoutAggregate,
    anchorSetId,
    excludedSetIds,
  );

  const lastAvailableSet = availableSets[availableSets.length - 1];

  return nextUnfinishedSet?.id ?? lastAvailableSet?.id ?? null;
}

export function getActiveSetIdAfterRemoval(
  workoutAggregate: WorkoutAggregate,
  removedSetIds: ReadonlySet<WorkoutSetId>,
): WorkoutSetId | null {
  const activeSetId = workoutAggregate.workout.activeSetId;

  if (activeSetId === null || !removedSetIds.has(activeSetId)) {
    return activeSetId;
  }

  return getNextActiveWorkoutSetIdAfter(
    workoutAggregate,
    activeSetId,
    removedSetIds,
  );
}

export function getRestTimerAfterRemoval(
  workoutAggregate: WorkoutAggregate,
  remainingSets: readonly WorkoutSet[],
  removedSetIds: ReadonlySet<WorkoutSetId>,
): WorkoutRestTimer | null {
  const restTimer = workoutAggregate.workout.restTimer;

  if (restTimer === null) {
    return null;
  }

  const timerSourceWasRemoved = removedSetIds.has(restTimer.sourceSetId);
  const hasUnfinishedSet = remainingSets.some(
    ({ finishedAt }) => finishedAt === null,
  );

  return timerSourceWasRemoved || !hasUnfinishedSet ? null : restTimer;
}

export function isWorkoutRestTimerExpired(
  restTimer: WorkoutRestTimer,
  now: number,
): boolean {
  return restTimer.endsAt <= now;
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
