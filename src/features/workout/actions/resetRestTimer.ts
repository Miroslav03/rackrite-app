import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import { resetWorkoutRestTimer } from "@/domain/workout/workout.useCases";

export type ResetRestTimerDependencies = {
  repository: Pick<WorkoutRepository, "saveWorkoutAggregate">;
  now: () => number;
};

export async function resetRestTimer(
  dependencies: ResetRestTimerDependencies,
  workout: WorkoutAggregate,
): Promise<WorkoutAggregate> {
  const nextWorkout = resetWorkoutRestTimer(workout, {
    now: dependencies.now(),
  });

  if (nextWorkout === workout) {
    return workout;
  }

  await dependencies.repository.saveWorkoutAggregate(nextWorkout);

  return nextWorkout;
}
