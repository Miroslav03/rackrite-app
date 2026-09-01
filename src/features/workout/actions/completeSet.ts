import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import { getAllWorkoutSets } from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import {
  completeWorkoutSet,
  startWorkoutRestTimer,
} from "@/domain/workout/workout.useCases";

export type CompleteSetCommand = {
  workoutSetId: WorkoutSetId;
};

export type CompleteSetDependencies = {
  repository: Pick<WorkoutRepository, "updateWorkoutAggregate">;
  now: () => number;
};

export async function completeSet(
  dependencies: CompleteSetDependencies,
  workout: WorkoutAggregate,
  command: CompleteSetCommand,
): Promise<WorkoutAggregate> {
  const now = dependencies.now();

  const completedWorkout = completeWorkoutSet(workout, {
    setId: command.workoutSetId,
    now,
  });

  const hasRemainingUnfinishedSet = getAllWorkoutSets(completedWorkout).some(
    (set) => set.finishedAt === null,
  );

  const nextWorkout = hasRemainingUnfinishedSet
    ? startWorkoutRestTimer(completedWorkout, {
        setId: command.workoutSetId,
        now,
      })
    : completedWorkout;

  await dependencies.repository.updateWorkoutAggregate(workout, nextWorkout);

  return nextWorkout;
}
