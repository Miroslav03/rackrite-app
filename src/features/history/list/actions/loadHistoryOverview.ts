import type { WorkoutHistoryRepository } from "@/data/repositories/historyRepository";

import { HISTORY_PAGE_SIZE, loadHistoryPage } from "./loadHistoryPage";

export type LoadHistoryOverviewDependencies = {
  repository: Pick<
    WorkoutHistoryRepository,
    "getCompletedWorkoutPage" | "getCompletedWorkoutCount"
  >;
};

export async function loadHistoryOverview(
  dependencies: LoadHistoryOverviewDependencies,
) {
  const [page, totalCount] = await Promise.all([
    loadHistoryPage(dependencies, { limit: HISTORY_PAGE_SIZE, cursor: null }),
    dependencies.repository.getCompletedWorkoutCount(),
  ]);

  return { page, totalCount };
}
