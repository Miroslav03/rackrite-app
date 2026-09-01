import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import { skipWorkoutRestTimer } from "@/domain/workout/workout.useCases";

export type SkipRestTimerDependencies = {
  repository: Pick<WorkoutRepository, "saveWorkoutAggregate">;
  now: () => number;
};

export async function skipRestTimer(
  dependencies: SkipRestTimerDependencies,
  workout: WorkoutAggregate,
): Promise<WorkoutAggregate> {
  const nextWorkout = skipWorkoutRestTimer(workout, {
    now: dependencies.now(),
  });

  if (nextWorkout === workout) {
    return workout;
  }

  await dependencies.repository.saveWorkoutAggregate(nextWorkout);

  return nextWorkout;
}
