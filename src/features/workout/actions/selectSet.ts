import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import { selectWorkoutSet } from "@/domain/workout/workout.useCases";

export type SelectSetCommand = {
  workoutSetId: WorkoutSetId;
};

export type SelectSetDependencies = {
  repository: Pick<WorkoutRepository, "updateWorkoutAggregate">;
  now: () => number;
};

export async function selectSet(
  dependencies: SelectSetDependencies,
  workout: WorkoutAggregate,
  command: SelectSetCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = selectWorkoutSet(workout, {
    setId: command.workoutSetId,
    now: dependencies.now(),
  });

  await dependencies.repository.updateWorkoutAggregate(workout, nextWorkout);

  return nextWorkout;
}
