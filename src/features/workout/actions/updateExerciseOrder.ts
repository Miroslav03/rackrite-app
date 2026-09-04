import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutExerciseId,
} from "@/domain/workout/workout.types";
import { updateWorkoutExerciseOrder } from "@/domain/workout/workout.useCases";

export type UpdateExerciseOrderCommand = {
  workoutExerciseId: WorkoutExerciseId;
  orderIndex: number;
};

export type UpdateExerciseOrderDependencies = {
  repository: Pick<WorkoutRepository, "updateWorkoutAggregate">;
  now: () => number;
};

export async function updateExerciseOrder(
  dependencies: UpdateExerciseOrderDependencies,
  workout: WorkoutAggregate,
  command: UpdateExerciseOrderCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = updateWorkoutExerciseOrder(workout, {
    ...command,
    now: dependencies.now(),
  });

  if (nextWorkout === workout) {
    return workout;
  }

  await dependencies.repository.updateWorkoutAggregate(workout, nextWorkout);

  return nextWorkout;
}
