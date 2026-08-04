import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type {
  Exercise,
  ExerciseKind,
} from "@/domain/exercises/exercise.types";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import { addWorkoutExercise } from "@/domain/workout/workout.useCases";

export type AddExerciseCommand = {
  exercise: Exercise;
};

export type AddExerciseDependencies = {
  repository: Pick<WorkoutRepository, "saveWorkoutAggregate">;
  now: () => number;
  createWorkoutExerciseId: () => WorkoutExerciseId;
  createWorkoutSetId: () => WorkoutSetId;
  getDefaultRestSeconds: (kind: ExerciseKind) => number;
};

export async function addExercise(
  dependencies: AddExerciseDependencies,
  workout: WorkoutAggregate,
  command: AddExerciseCommand,
): Promise<WorkoutAggregate> {
  const restSeconds =
    command.exercise.defaultRestSeconds ??
    dependencies.getDefaultRestSeconds(command.exercise.kind);

  const nextWorkout = addWorkoutExercise(workout, {
    workoutExerciseId: dependencies.createWorkoutExerciseId(),
    setId: dependencies.createWorkoutSetId(),
    exercise: command.exercise,
    restSeconds,
    now: dependencies.now(),
  });

  await dependencies.repository.saveWorkoutAggregate(nextWorkout);

  return nextWorkout;
}
