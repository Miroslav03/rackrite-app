import type { LiftFamily, SetType } from "@/domain/domain.types";
import { assertWorkoutIsCompleted } from "@/domain/workout/assertions/workout.contracts";
import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import {
  getWorkoutDurationMinutes,
  isCompletedSet,
  selectTopSet,
} from "@/domain/workout/workout.utils";

import type {
  HistoryExerciseSummary,
  HistoryWorkoutSummary,
} from "./history.types";

export function summarizeCompletedWorkout(
  aggregate: WorkoutAggregate,
): HistoryWorkoutSummary {
  assertWorkoutIsCompleted(aggregate);

  const { workout } = aggregate;

  const liftFamilies = new Set<LiftFamily>();
  const exercises: HistoryExerciseSummary[] = [];

  let totalWeight = 0;

  for (const { workoutExercise, exercise, sets } of aggregate.exercises) {
    const completedSets = sets.filter(isCompletedSet);

    if (completedSets.length === 0) continue;

    if (exercise.liftFamily !== null) liftFamilies.add(exercise.liftFamily);
    const setCounts: Record<SetType, number> = {
      warmup: 0,
      working: 0,
      top: 0,
      backoff: 0,
    };

    for (const set of completedSets) {
      setCounts[set.type] += 1;
      totalWeight += set.weight * set.reps;
    }

    const topSet = selectTopSet(completedSets);
    exercises.push({
      id: workoutExercise.id,
      name: exercise.name,
      totalSets: completedSets.length,
      setCounts,
      topSet: { weight: topSet.weight, reps: topSet.reps },
    });
  }

  return {
    id: workout.id,
    sourceTemplateId: workout.sourceTemplateId,
    startedAt: workout.startedAt,
    durationMinutes: getWorkoutDurationMinutes(
      workout.startedAt,
      workout.finishedAt,
    ),
    totalWeight,
    liftFamilies: [...liftFamilies],
    exercises,
  };
}
