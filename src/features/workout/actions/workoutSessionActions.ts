import {
    workoutRepository,
    type WorkoutRepository,
} from "@/data/repositories/workoutRepository";

import type {
    WorkoutAggregate,
    WorkoutId,
} from "@/domain/workout/workout.types";

import { createId } from "@/shared/utils/id";

import { startQuickWorkout } from "./startQuickWorkout";

export type WorkoutSessionActions = {
  loadActiveWorkout: () => Promise<WorkoutAggregate | null>;
  startEmptyWorkout: () => Promise<WorkoutAggregate>;
};

type CreateWorkoutSessionActionsDependencies = {
  repository: WorkoutRepository;
  now: () => number;
  createWorkoutId: () => WorkoutId;
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
  };
}

export const workoutSessionActions = createWorkoutSessionActions({
  repository: workoutRepository,
  now: Date.now,
  createWorkoutId: () => createId("workout"),
});
