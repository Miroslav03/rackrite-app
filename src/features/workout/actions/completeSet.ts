import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import { completeWorkoutSet } from "@/domain/workout/workout.useCases";

export type CompleteSetCommand = {
  workoutSetId: WorkoutSetId;
};

export type CompleteSetDependencies = {
  repository: Pick<WorkoutRepository, "saveWorkoutAggregate">;
  now: () => number;
};

export async function completeSet(
  dependencies: CompleteSetDependencies,
  workout: WorkoutAggregate,
  command: CompleteSetCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = completeWorkoutSet(workout, {
    setId: command.workoutSetId,
    now: dependencies.now(),
  });

  await dependencies.repository.saveWorkoutAggregate(nextWorkout);

  return nextWorkout;
}
