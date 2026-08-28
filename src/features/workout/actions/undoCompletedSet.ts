import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import { undoWorkoutSetCompletion } from "@/domain/workout/workout.useCases";

export type UndoSetCompletionCommand = {
  workoutSetId: WorkoutSetId;
};

export type UndoSetCompletionDependencies = {
  repository: Pick<WorkoutRepository, "saveWorkoutAggregate">;
  now: () => number;
};

export async function undoCompletedSet(
  dependencies: UndoSetCompletionDependencies,
  workout: WorkoutAggregate,
  command: UndoSetCompletionCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = undoWorkoutSetCompletion(workout, {
    setId: command.workoutSetId,
    now: dependencies.now(),
  });

  await dependencies.repository.saveWorkoutAggregate(nextWorkout);

  return nextWorkout;
}
