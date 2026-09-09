import type { WorkoutHistoryRepository } from "@/data/repositories/historyRepository";

import type {
  HistoryPage,
  HistoryPageRequest,
} from "@/domain/history/history.types";
import { summarizeCompletedWorkout } from "@/domain/history/history.utils";

export const HISTORY_PAGE_SIZE = 3;

export type LoadHistoryPageDependencies = {
  repository: Pick<WorkoutHistoryRepository, "getCompletedWorkoutPage">;
};

export async function loadHistoryPage(
  dependencies: LoadHistoryPageDependencies,
  request: HistoryPageRequest,
): Promise<HistoryPage> {
  const page = await dependencies.repository.getCompletedWorkoutPage(request);

  return {
    items: page.workouts.map(summarizeCompletedWorkout),
    nextCursor: page.nextCursor,
  };
}
