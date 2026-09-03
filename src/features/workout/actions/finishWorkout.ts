import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import { finishWorkout as finishWorkoutUseCase } from "@/domain/workout/workout.useCases";

export type FinishWorkoutCommand = {
  skipUnfinishedSets: boolean;
};

export type FinishWorkoutDependencies = {
  repository: Pick<WorkoutRepository, "updateWorkoutAggregate">;
  now: () => number;
};

export async function finishWorkout(
  dependencies: FinishWorkoutDependencies,
  workout: WorkoutAggregate,
  command: FinishWorkoutCommand,
): Promise<void> {
  const finishedWorkout = finishWorkoutUseCase(workout, {
    now: dependencies.now(),
    skipUnfinishedSets: command.skipUnfinishedSets,
  });

  await dependencies.repository.updateWorkoutAggregate(
    workout,
    finishedWorkout,
  );
}
