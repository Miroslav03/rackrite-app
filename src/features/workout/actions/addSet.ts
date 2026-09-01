import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutSetId,
  WorkoutSetValues,
} from "@/domain/workout/workout.types";
import { addWorkoutSet } from "@/domain/workout/workout.useCases";

type AddSetInitialValues = Partial<WorkoutSetValues>;

export type AddSetCommand = {
  workoutExerciseId: WorkoutExerciseId;
  initialValues?: AddSetInitialValues;
};

export type AddSetDependencies = {
  repository: Pick<WorkoutRepository, "updateWorkoutAggregate">;
  createWorkoutSetId: () => WorkoutSetId;
  now: () => number;
};

export async function addSet(
  dependencies: AddSetDependencies,
  workout: WorkoutAggregate,
  command: AddSetCommand,
): Promise<WorkoutAggregate> {
  const nextWorkout = addWorkoutSet(workout, {
    workoutExerciseId: command.workoutExerciseId,
    now: dependencies.now(),
    setId: dependencies.createWorkoutSetId(),
    ...command.initialValues,
  });

  await dependencies.repository.updateWorkoutAggregate(workout, nextWorkout);

  return nextWorkout;
}
