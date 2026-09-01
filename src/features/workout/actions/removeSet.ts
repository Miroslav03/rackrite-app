import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import { removeWorkoutSet } from "@/domain/workout/workout.useCases";

export type RemoveSetCommand = {
  workoutSetId: WorkoutSetId;
};

export type RemoveSetDependencies = {
  repository: Pick<WorkoutRepository, "updateWorkoutAggregate">;
  now: () => number;
};

export async function removeSet(
  dependencies: RemoveSetDependencies,
  workout: WorkoutAggregate,
  command: RemoveSetCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = removeWorkoutSet(workout, {
    setId: command.workoutSetId,
    now: dependencies.now(),
  });

  await dependencies.repository.updateWorkoutAggregate(workout, nextWorkout);

  return nextWorkout;
}
