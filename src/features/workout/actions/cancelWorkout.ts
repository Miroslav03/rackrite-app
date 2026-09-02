import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import { cancelWorkout as cancelWorkoutUseCase } from "@/domain/workout/workout.useCases";

export type CancelWorkoutDependencies = {
  repository: Pick<WorkoutRepository, "deleteWorkoutAggregate">;
};

export async function cancelWorkout(
  dependencies: CancelWorkoutDependencies,
  workout: WorkoutAggregate,
): Promise<void> {
  const workoutId = cancelWorkoutUseCase(workout);

  await dependencies.repository.deleteWorkoutAggregate(workoutId);
}
