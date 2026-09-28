import { ExerciseId } from "../exercises/exercise.types";
import { TemplateAggregate } from "../templates/editor/templates.types";

import { assertWorkoutAggregateInvariants } from "./assertions/workout.invariants";
import type {
  WorkoutAggregate,
  WorkoutExerciseAggregate,
  WorkoutSet,
} from "./workout.types";

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

export function uniquePreviousExercises(
  template: TemplateAggregate,
  previous: WorkoutAggregate | null,
): Map<ExerciseId, WorkoutExerciseAggregate> {
  const matches = new Map<ExerciseId, WorkoutExerciseAggregate>();

  if (!previous) return matches;

  if (
    previous.workout.status !== "completed" ||
    previous.workout.finishedAt === null ||
    previous.workout.sourceTemplateId !== template.template.id
  ) {
    throw new Error(
      "Previous workout must be a completed execution of this template",
    );
  }

  assertWorkoutAggregateInvariants(previous);

  for (const entry of template.exercises) {
    const id = entry.exercise.id;

    if (
      template.exercises.filter(({ exercise }) => exercise.id === id).length !==
      1
    ) {
      continue;
    }

    const candidates = previous.exercises.filter(
      ({ exercise }) => exercise.id === id,
    );

    if (candidates.length === 1) matches.set(id, candidates[0]);
  }

  return matches;
}
