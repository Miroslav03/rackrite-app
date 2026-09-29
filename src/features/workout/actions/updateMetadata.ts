import type { WorkoutRepository } from "@/data/repositories/workoutRepository";
import type { Workout, WorkoutAggregate } from "@/domain/workout/workout.types";
import { updateWorkoutMetadata } from "@/domain/workout/workout.useCases";

export type UpdateWorkoutMetadataCommand = Pick<Workout, "description">;

export async function updateMetadata(
  dependencies: {
    repository: Pick<WorkoutRepository, "updateWorkoutAggregate">;
    now: () => number;
  },
  workout: WorkoutAggregate,
  command: UpdateWorkoutMetadataCommand,
): Promise<WorkoutAggregate> {
  const next = updateWorkoutMetadata(workout, {
    ...command,
    now: dependencies.now(),
  });
  await dependencies.repository.updateWorkoutAggregate(workout, next);
  return next;
}
