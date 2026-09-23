import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import { createRepeatedWorkout } from "@/domain/workout/workout.useCases";

export type RepeatWorkoutCommand = {
  sourceWorkoutId: WorkoutId;
  expectedActiveWorkoutId: WorkoutId | null;
};

export type RepeatWorkoutDependencies = {
  repository: Pick<
    WorkoutRepository,
    "getWorkoutAggregateById" | "startWorkoutAggregate"
  >;
  now: () => number;
  createWorkoutId: () => WorkoutId;
  createWorkoutExerciseId: () => WorkoutExerciseId;
  createWorkoutSetId: () => WorkoutSetId;
};

export async function repeatWorkout(
  dependencies: RepeatWorkoutDependencies,
  command: RepeatWorkoutCommand,
): Promise<WorkoutAggregate> {
  const source = await dependencies.repository.getWorkoutAggregateById(
    command.sourceWorkoutId,
  );

  if (!source) throw new Error("The completed workout is no longer available");

  const workout = createRepeatedWorkout(source, {
    id: dependencies.createWorkoutId(),
    now: dependencies.now(),
    createWorkoutExerciseId: dependencies.createWorkoutExerciseId,
    createWorkoutSetId: dependencies.createWorkoutSetId,
  });

  await dependencies.repository.startWorkoutAggregate(
    workout,
    command.expectedActiveWorkoutId,
  );

  return workout;
}
