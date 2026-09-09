import type { WorkoutSet } from "./workout.types";

type CompletedSet = WorkoutSet & {
  weight: number;
  reps: number;
  finishedAt: number;
};

export function isCompletedSet(set: WorkoutSet): set is CompletedSet {
  return set.finishedAt !== null && set.weight !== null && set.reps !== null;
}

export function selectTopSet(sets: readonly CompletedSet[]): CompletedSet {
  const nonWarmupSets = sets.filter(({ type }) => type !== "warmup");
  const candidates = nonWarmupSets.length > 0 ? nonWarmupSets : sets;

  return candidates.reduce((best, set) => {
    if (set.weight !== best.weight)
      return set.weight > best.weight ? set : best;
    if (set.reps !== best.reps) return set.reps > best.reps ? set : best;
    return set.setIndex < best.setIndex ? set : best;
  });
}

export function getWorkoutDurationMinutes(
  startedAt: number,
  finishedAt: number,
): number {
  return Math.max(0, Math.floor((finishedAt - startedAt) / 60_000));
}
