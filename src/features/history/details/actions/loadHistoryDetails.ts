import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type { HistoryWorkoutDetails } from "@/domain/history/history.types";
import { selectHistoryWorkoutDetails } from "@/domain/history/history.utils";
import type { WorkoutId } from "@/domain/workout/workout.types";

export async function loadHistoryDetails(
  dependencies: {
    repository: Pick<WorkoutRepository, "getWorkoutAggregateById">;
  },
  workoutId: WorkoutId,
): Promise<HistoryWorkoutDetails | null> {
  const aggregate =
    await dependencies.repository.getWorkoutAggregateById(workoutId);

  if (
    !aggregate ||
    aggregate.workout.status !== "completed" ||
    aggregate.workout.finishedAt === null
  ) {
    return null;
  }

  return selectHistoryWorkoutDetails(aggregate);
}
