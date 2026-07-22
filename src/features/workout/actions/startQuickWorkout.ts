import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutId,
} from "@/domain/workout/workout.types";
import { createEmptyWorkout } from "@/domain/workout/workout.useCases";

export type StartQuickWorkoutDependencies = {
  repository: Pick<
    WorkoutRepository,
    "getActiveWorkoutAggregate" | "saveWorkoutAggregate"
  >;
  now: () => number;
  createWorkoutId: () => WorkoutId;
};

export async function startQuickWorkout(
  dependencies: StartQuickWorkoutDependencies,
): Promise<WorkoutAggregate> {
  const existingWorkout =
    await dependencies.repository.getActiveWorkoutAggregate();

  if (existingWorkout) {
    return existingWorkout;
  }

  const workout = createEmptyWorkout({
    id: dependencies.createWorkoutId(),
    now: dependencies.now(),
  });

  await dependencies.repository.saveWorkoutAggregate(workout);

  return workout;
}
