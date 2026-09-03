import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import { getWorkoutExerciseById } from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import { addWorkoutSet } from "@/domain/workout/workout.useCases";

export type CopyPreviousSetCommand = {
  workoutExerciseId: WorkoutExerciseId;
};

export type CopyPreviousSetDependencies = {
  repository: Pick<WorkoutRepository, "updateWorkoutAggregate">;
  createWorkoutSetId: () => WorkoutSetId;
  now: () => number;
};

export async function copyPreviousSet(
  dependencies: CopyPreviousSetDependencies,
  workout: WorkoutAggregate,
  command: CopyPreviousSetCommand,
): Promise<WorkoutAggregate> {
  const workoutExercise = getWorkoutExerciseById(
    workout,
    command.workoutExerciseId,
  );
  const previousSet = workoutExercise?.sets[workoutExercise.sets.length - 1];

  const nextWorkout = addWorkoutSet(workout, {
    workoutExerciseId: command.workoutExerciseId,
    now: dependencies.now(),
    setId: dependencies.createWorkoutSetId(),
    type: previousSet?.type,
    weight: previousSet?.weight,
    reps: previousSet?.reps,
    rpe: previousSet?.rpe,
  });

  await dependencies.repository.updateWorkoutAggregate(workout, nextWorkout);

  return nextWorkout;
}
