import {
  workoutRepository,
  type WorkoutRepository,
} from "@/data/repositories/workoutRepository";

import type { ExerciseKind } from "@/domain/exercises/exercise.types";
import { DEFAULT_REST_SECONDS_BY_EXERCISE_KIND } from "@/domain/settings/settings.constants";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import { createId } from "@/shared/utils/id";

import { addExercise, type AddExerciseCommand } from "./addExercise";
import { removeExercise, type RemoveExerciseCommand } from "./removeExercise";
import { startQuickWorkout } from "./startQuickWorkout";

export type WorkoutSessionActions = {
  loadActiveWorkout: () => Promise<WorkoutAggregate | null>;
  startEmptyWorkout: () => Promise<WorkoutAggregate>;
  addExercise: (
    workout: WorkoutAggregate,
    command: AddExerciseCommand,
  ) => Promise<WorkoutAggregate>;
  removeExercise: (
    workout: WorkoutAggregate,
    command: RemoveExerciseCommand,
  ) => Promise<WorkoutAggregate>;
};

type CreateWorkoutSessionActionsDependencies = {
  repository: WorkoutRepository;
  now: () => number;
  createWorkoutId: () => WorkoutId;
  createWorkoutExerciseId: () => WorkoutExerciseId;
  createWorkoutSetId: () => WorkoutSetId;
  getDefaultRestSeconds: (kind: ExerciseKind) => number;
};

export function createWorkoutSessionActions(
  dependencies: CreateWorkoutSessionActionsDependencies,
): WorkoutSessionActions {
  return {
    loadActiveWorkout: () =>
      dependencies.repository.getActiveWorkoutAggregate(),

    startEmptyWorkout: () =>
      startQuickWorkout({
        repository: dependencies.repository,
        now: dependencies.now,
        createWorkoutId: dependencies.createWorkoutId,
      }),

    addExercise: (workout, command) =>
      addExercise(
        {
          repository: dependencies.repository,
          now: dependencies.now,
          createWorkoutExerciseId: dependencies.createWorkoutExerciseId,
          createWorkoutSetId: dependencies.createWorkoutSetId,
          getDefaultRestSeconds: dependencies.getDefaultRestSeconds,
        },
        workout,
        command,
      ),

    removeExercise: (workout, command) =>
      removeExercise(
        {
          repository: dependencies.repository,
          now: dependencies.now,
        },
        workout,
        command,
      ),
  };
}

export const workoutSessionActions = createWorkoutSessionActions({
  repository: workoutRepository,
  now: Date.now,
  createWorkoutId: () => createId("workout"),
  createWorkoutExerciseId: () => createId("workout_exercise"),
  createWorkoutSetId: () => createId("set"),
  getDefaultRestSeconds: (kind) => DEFAULT_REST_SECONDS_BY_EXERCISE_KIND[kind],
});
