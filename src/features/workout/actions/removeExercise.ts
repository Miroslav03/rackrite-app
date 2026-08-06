import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutExerciseId,
} from "@/domain/workout/workout.types";
import { removeWorkoutExercise } from "@/domain/workout/workout.useCases";

export type RemoveExerciseCommand = {
  workoutExerciseId: WorkoutExerciseId;
};

export type RemoveExerciseDependencies = {
  repository: Pick<WorkoutRepository, "saveWorkoutAggregate">;
  now: () => number;
};

export async function removeExercise(
  dependencies: RemoveExerciseDependencies,
  workout: WorkoutAggregate,
  command: RemoveExerciseCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = removeWorkoutExercise(workout, {
    workoutExerciseId: command.workoutExerciseId,
    now: dependencies.now(),
  });

  await dependencies.repository.saveWorkoutAggregate(nextWorkout);

  return nextWorkout;
}
