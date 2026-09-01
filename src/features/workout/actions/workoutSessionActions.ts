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

import {
  adjustRestTimer,
  type AdjustRestTimerCommand,
} from "./adjustRestTimer";
import { addExercise, type AddExerciseCommand } from "./addExercise";
import { addSet, type AddSetCommand } from "./addSet";
import { completeSet, type CompleteSetCommand } from "./completeSet";
import { removeExercise, type RemoveExerciseCommand } from "./removeExercise";
import { removeSet, type RemoveSetCommand } from "./removeSet";
import { resetRestTimer } from "./resetRestTimer";
import { selectSet, type SelectSetCommand } from "./selectSet";
import { skipRestTimer } from "./skipRestTimer";
import { startQuickWorkout } from "./startQuickWorkout";
import {
  undoCompletedSet,
  type UndoSetCompletionCommand,
} from "./undoCompletedSet";
import { updateSet, type UpdateSetCommand } from "./updateSet";

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
  removeSet: (
    workout: WorkoutAggregate,
    command: RemoveSetCommand,
  ) => Promise<WorkoutAggregate>;
  addSet: (
    workout: WorkoutAggregate,
    command: AddSetCommand,
  ) => Promise<WorkoutAggregate>;
  updateSet: (
    workout: WorkoutAggregate,
    command: UpdateSetCommand,
  ) => Promise<WorkoutAggregate>;
  selectSet: (
    workout: WorkoutAggregate,
    command: SelectSetCommand,
  ) => Promise<WorkoutAggregate>;
  completeSet: (
    workout: WorkoutAggregate,
    command: CompleteSetCommand,
  ) => Promise<WorkoutAggregate>;
  adjustRestTimer: (
    workout: WorkoutAggregate,
    command: AdjustRestTimerCommand,
  ) => Promise<WorkoutAggregate>;
  resetRestTimer: (workout: WorkoutAggregate) => Promise<WorkoutAggregate>;
  skipRestTimer: (workout: WorkoutAggregate) => Promise<WorkoutAggregate>;
  undoCompletedSet: (
    workout: WorkoutAggregate,
    command: UndoSetCompletionCommand,
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

    removeSet: (workout, command) =>
      removeSet(
        {
          repository: dependencies.repository,
          now: dependencies.now,
        },
        workout,
        command,
      ),

    addSet: (workout, command) =>
      addSet(
        {
          repository: dependencies.repository,
          now: dependencies.now,
          createWorkoutSetId: dependencies.createWorkoutSetId,
        },
        workout,
        command,
      ),

    updateSet: (workout, command) =>
      updateSet(
        {
          repository: dependencies.repository,
          now: dependencies.now,
        },
        workout,
        command,
      ),

    selectSet: (workout, command) =>
      selectSet(
        {
          repository: dependencies.repository,
          now: dependencies.now,
        },
        workout,
        command,
      ),

    completeSet: (workout, command) =>
      completeSet(
        {
          repository: dependencies.repository,
          now: dependencies.now,
        },
        workout,
        command,
      ),

    adjustRestTimer: (workout, command) =>
      adjustRestTimer(
        {
          repository: dependencies.repository,
          now: dependencies.now,
        },
        workout,
        command,
      ),

    resetRestTimer: (workout) =>
      resetRestTimer(
        {
          repository: dependencies.repository,
          now: dependencies.now,
        },
        workout,
      ),

    skipRestTimer: (workout) =>
      skipRestTimer(
        {
          repository: dependencies.repository,
          now: dependencies.now,
        },
        workout,
      ),

    undoCompletedSet: (workout, command) =>
      undoCompletedSet(
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
