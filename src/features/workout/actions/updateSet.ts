import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutSetId,
  WorkoutSetValues,
} from "@/domain/workout/workout.types";
import { updateWorkoutSet } from "@/domain/workout/workout.useCases";

export type UpdateSetCommand = {
  workoutSetId: WorkoutSetId;
  values: Partial<WorkoutSetValues>;
};

export type UpdateSetDependencies = {
  repository: Pick<WorkoutRepository, "saveWorkoutAggregate">;
  now: () => number;
};

export async function updateSet(
  dependencies: UpdateSetDependencies,
  workout: WorkoutAggregate,
  command: UpdateSetCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = updateWorkoutSet(workout, {
    setId: command.workoutSetId,
    now: dependencies.now(),
    ...command.values,
  });

  await dependencies.repository.saveWorkoutAggregate(nextWorkout);

  return nextWorkout;
}
