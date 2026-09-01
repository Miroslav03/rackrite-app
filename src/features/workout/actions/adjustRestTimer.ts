import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import { adjustWorkoutRestTimer } from "@/domain/workout/workout.useCases";

export type RestTimerAdjustmentSeconds = -15 | 15;

export type AdjustRestTimerCommand = {
  seconds: RestTimerAdjustmentSeconds;
};

export type AdjustRestTimerDependencies = {
  repository: Pick<WorkoutRepository, "saveWorkoutAggregate">;
  now: () => number;
};

export async function adjustRestTimer(
  dependencies: AdjustRestTimerDependencies,
  workout: WorkoutAggregate,
  command: AdjustRestTimerCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = adjustWorkoutRestTimer(workout, {
    seconds: command.seconds,
    now: dependencies.now(),
  });

  if (nextWorkout === workout) {
    return workout;
  }

  await dependencies.repository.saveWorkoutAggregate(nextWorkout);

  return nextWorkout;
}
